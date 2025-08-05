class AudioWorkletPlayer {
    constructor(data, midiManager) {
        this.sections = data.sections;
        this.currentSectionIndex = 0;
        this.currentSection = this.sections[this.currentSectionIndex];
        this.playingSectionIndex = 0; // Track which section is actually playing
        this.sectionRepeatCount = 0; // Track how many times current section has played
        this.midiManager = midiManager;
        this.audioContext = null;
        this.clockNode = null;
        this.isPlaying = false;
        this.trackStates = [];
        this.bpm = this.currentSection.bpm || 120;
        this.beatsInBar = 4;
        this.bar = 60 / this.bpm * this.beatsInBar;
        this.barDuration = this.bar;
        this.muted = false;
        this.noteOffs = [];
        this.startTime = 0;
        this.currentLoop = 0;
        this.currentStep = 0;
        this.maxSteps = 0;
        this.sectionStartTime = 0; // Track when current section started
        this.onSectionChange = null; // Callback for when playback section changes
        this.onStepChange = null; // Callback for step change
        this.cleanIdealTimes = false;
        // TODO: Add as input
        this.randomSeed = 6545324874324;
        this.randomGenerator = new SeededRandom(this.randomSeed);
    }
    async init() {
        this.audioContext = new AudioContext();

        // Load the clock worklet
        const workletCode = $('clock-worklet').textContent;
        const blob = new Blob([workletCode], { type: 'application/javascript' });
        const workletUrl = URL.createObjectURL(blob);

        await this.audioContext.audioWorklet.addModule(workletUrl);

        this.clockNode = new AudioWorkletNode(this.audioContext, 'clock');
        this.clockNode.connect(this.audioContext.destination);

        // Handle clock messages
        this.clockNode.port.onmessage = (event) => {
            this.handleTick(event.data);
        };

        URL.revokeObjectURL(workletUrl);
    }

    advancePlayingSection() {
        const nextSectionIndex = (this.playingSectionIndex + 1) % this.sections.length;

        this.playingSectionIndex = nextSectionIndex;
        const playingSection = this.sections[this.playingSectionIndex];

        // Update playback BPM
        const newBpm = playingSection.bpm || 120;
        if(newBpm !== this.bpm) this.setTempo(newBpm);

        // Update track states
        this.updateTrackStates();

        // Update maxSteps for the new section
        this.maxSteps = Math.max(...playingSection.tracks.map(track => this.calculatePatternLength(track.pattern)));

        // Notify sequencer of section change
        if (this.onSectionChange) {
            this.onSectionChange(this.playingSectionIndex);
        }
    }

    setTempo(newBpm) {
        this.bpm = newBpm;
        this.bar = 60 / this.bpm * this.beatsInBar;
        this.barDuration = this.bar;

        if (this.clockNode) {
            this.clockNode.port.postMessage({ type: 'setBPM', bpm: newBpm });
        }

        console.log(`BPM updated to ${newBpm}`);
    }

    setOnSectionChange(callback) {
        this.onSectionChange = callback;
    }

    setOnStepChange(callback) {
        this.onStepChange = callback
    }

    // Method to check if current section should advance
    shouldAdvanceSection(elapsedTime) {
        const playingSection = this.sections[this.playingSectionIndex];
        const sectionRepeat = playingSection.repeat || 1;
        const sectionDuration = this.bar; // One bar per section play

        // Calculate how many complete cycles we should have for the current repeat
        const currentRepeatDuration = sectionDuration;

        return elapsedTime >= currentRepeatDuration;
    }

    flattenPattern(pattern) {
        const steps = [];
        const timePerStep = this.bar / this.calculatePatternLength(pattern);
        let currentTime = 0;

        const walk = (stepsArr, stepDur) => {
            for (let i = 0; i < stepsArr.length; i++) {
                const step = stepsArr[i];

               if (this.cleanIdealTimes && step.idealTime !== undefined) {
                    delete step.idealTime;
                }

                if (step.subdivide && step.pattern) {
                    const span = step.span || 1;
                    const subdivDur = stepDur * span / step.subdivide;
                    walk(step.pattern, subdivDur);
                } else {
                    steps.push({
                        ...step,
                        duration: stepDur,
                        startTime: currentTime,
                        endTime: currentTime + stepDur
                    });
                    currentTime += stepDur;
                }
            }
        };

        walk(pattern, timePerStep);
        if(this.cleanIdealTimes) this.cleanIdealTimes = false;
        return steps;
    }

    updateTrackStates() {
        const playingSection = this.sections[this.playingSectionIndex];


        let currentPatternPosition = 0;

        if (this.isPlaying && this.sectionStartTime > 0) {
            const now = this.audioContext.currentTime;
            const sectionElapsedTime = now - this.sectionStartTime;
            currentPatternPosition = sectionElapsedTime % this.bar;
        }

        // Create fresh track states for the current playing section
        this.trackStates = playingSection.tracks.map((track, i) => {
            const flatSteps = this.flattenPattern(track.pattern);

            // If not playing, start from beginning
            if (!this.isPlaying) {
                return {
                    flatSteps,
                    index: 0,
                    hasFired: false,
                };
            }

            // Find the correct step index based on current pattern position
            let correctStepIndex = flatSteps.findIndex(
                step => currentPatternPosition >= step.startTime && currentPatternPosition < step.endTime
            );

            // Handle end of pattern - wrap to beginning
            if (flatSteps.length > 0) {
                const lastStep = flatSteps[flatSteps.length - 1];
                if (currentPatternPosition >= (lastStep.endTime)) {
                    correctStepIndex = 0; // Wrap to first step
                }
            }

            let hasFired = true;
            const currentStep = flatSteps[correctStepIndex];

            // Check if current position is before the step start time with a small tolerance
            if (currentStep && currentPatternPosition <= currentStep.startTime + 0.05) {
                hasFired = false;
            }

            return {
                flatSteps,
                index: correctStepIndex,
                hasFired: hasFired,
                count: 0
            };
        });

    }


    handleTick(tickData) {
        const now = tickData;

        if (this.startTime === 0) {
            this.startTime = now;
            this.sectionStartTime = now;
            this.currentLoop = 0;
            this.playingSectionIndex = 0;
            this.updateTrackStates();
            this.updatePlayhead(this.currentStep);
        } else {
            this.processNoteOffs(now);
        }

        const elapsedTime = now - this.startTime;
        let sectionElapsedTime = now - this.sectionStartTime;
        let patternPosition = sectionElapsedTime % this.bar;

        // Check if we should advance to the next section
        if (this.shouldAdvanceSection(sectionElapsedTime)) {
            const playingSection = this.sections[this.playingSectionIndex];
            const requiredRepeats = playingSection.repeat || 1;

            // Increment the repeat count first
            this.sectionRepeatCount++;

            // Check if we've completed all required repeats
            if (this.sectionRepeatCount > 0 && this.sectionRepeatCount >= requiredRepeats) {
                // We've completed all required repeats, advance to next section
                this.advancePlayingSection();
                this.sectionStartTime = now; // Reset section start time
                this.sectionRepeatCount = 0;
            } else {
                // Still have more repeats to go, reset timing and states for next repeat
                this.sectionStartTime = now;
                this.trackStates.forEach(state => {
                    state.index = 0;
                    state.hasFired = false;
                });
            }

            // After section changes, recalculate pattern position for the new/continuing section
            sectionElapsedTime = now - this.sectionStartTime;
            patternPosition = sectionElapsedTime % this.bar;
            this.currentLoop++;
        }

        const currentIndex = Math.floor(patternPosition / (this.bar / this.maxSteps));

        // Update visual cue based on longest track
        if (this.currentStep !== currentIndex) {
            this.updatePlayhead(currentIndex);
            this.currentStep = currentIndex;
        }

        this.fireSteps(patternPosition, now);
    }

    fireSteps(patternPosition, now) {
        const playingSection = this.sections[this.playingSectionIndex];

        this.trackStates.forEach((state, i) => {
            const track = playingSection.tracks[i];
            if (!track) return; // Safety check

            // Simple and clear: startTime + duration = end time
            const currentStep = state.flatSteps[state.index];
            if (!currentStep) return; // Safety check

            if (patternPosition >= currentStep.startTime && patternPosition < currentStep.endTime && !state.hasFired) {
                const step = currentStep;
                const defaults = track.defaults;

                let lucky = true;
                if ((track.defaults && track.defaults.odds) || step.odds) {
                    const randomValue = this.randomGenerator.next();
                    const odds = step.odds || track.defaults.odds || 1.0;
                    if (randomValue > odds) {
                        lucky = false;
                    }
                }

                let modded = true;
                if ((track.defaults && track.defaults.mod) || step.mod) {
                    const mod = step.mod || track.defaults.mod || 1;
                    if (this.currentLoop % mod !== 0) {
                        modded = false;
                    }
                }

                if (step && step.fire && !track.playback?.muted && lucky && modded) {

                    let note = step.note ?? defaults.note;

                    if (step.vibeMatrix || defaults.vibeMatrix) {
                        const vibe = step.vibeMatrix ?? defaults.vibeMatrix;
                        note = vibe.nextNote(step.octave ?? defaults.octave ?? 3, step.scale ?? defaults.scale ?? 4095);
                    }

                    const velocity = step.velocity ?? defaults.velocity ?? 100;
                    const channel = (step.channel ?? defaults.channel) - 1;

                    this.midiManager.sendNoteOn(note, velocity, channel);
                    this.scheduleNoteOff(note, channel, now + 0.1);
                }

                state.hasFired = true;
            }

            if (patternPosition >= currentStep.endTime) {
                state.index++;
                state.hasFired = false;
                if (state.index >= state.flatSteps.length) {
                    state.index = 0;
                }
            }

        });
    }


    playPreviewNote(note, channel, velocity = 100) {
        this.midiManager.sendNoteOn(note, velocity, channel);
        // Set timeout
        setTimeout(() => {
            this.midiManager.sendNoteOff(note, channel);
        }, 100);
    }

    scheduleNoteOff(note, channel, time) {
        this.noteOffs.push({
            note,
            channel,
            time
        });
    }

    processNoteOffs(currentTime) {
        // Process and remove note offs that are due
        this.noteOffs = this.noteOffs.filter(noteOff => {
            if (currentTime >= noteOff.time) {
                this.midiManager.sendNoteOff(noteOff.note, noteOff.channel);
                return false; // Remove from array
            }
            return true; // Keep in array
        });
    }

    getCurrentTime() {
        return this.audioContext.currentTime;
    }


    durationToTime(duration) {
        return (duration / this.bpm) * 60;
    }

    async play() {
        if (this.isPlaying) return;

        if (!this.audioContext) {
            await this.init();
        }

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // Reset timing variables
        this.startTime = 0;
        this.sectionStartTime = 0;
        this.sectionRepeatCount = 0;
        this.playingSectionIndex = 0;
        this.updateTrackStates();

        this.clockNode.port.postMessage("start");
        this.isPlaying = true;
    }

    stop() {
        if (!this.isPlaying) return;

        this.clockNode.port.postMessage("stop");
        this.isPlaying = false;

        // Reset timing
        this.startTime = 0;
        this.sectionStartTime = 0;
        this.sectionRepeatCount = 0;
        this.playingSectionIndex = this.currentSectionIndex;

        // Stop all MIDI notes
        this.midiManager.allNotesOff();
        this.noteOffs = []; // Clear scheduled note offs

        this.updatePlayhead(0);
    }

    setMuted(muted) {
        this.muted = muted;
    }

    getMaxSteps() {
        return Math.max(...this.currentSection.tracks.map(track => this.calculatePatternLength(track.pattern)));
    }

    calculatePatternLength(pattern) {
        return pattern.reduce((length, step) => {
            if (step.subdivide) {
                return length + (step.span || 1);
            }
            return length + 1;
        }, 0);
    }

    updatePlayhead(stepIndex) {
        if (this.onStepChange) {
            this.onStepChange(stepIndex, this.playingSectionIndex);
        }
    }

    getSectionInfo() {
        return {
            currentIndex: this.currentSectionIndex,
            currentName: this.currentSection.name,
            playingIndex: this.playingSectionIndex,
            playingName: this.sections[this.playingSectionIndex]?.name || 'Unknown',
            currentRepeat: this.sectionRepeatCount + 1,
            maxRepeats: this.sections[this.playingSectionIndex]?.repeat || 1,
            totalSections: this.sections.length,
            isPlaying: this.isPlaying
        };
    }

    forceSwitchToSection(newIndex) {
        // This is called by the sequencer when the currently playing section is removed.
        // It forces an immediate jump to a new section.

        // Ensure the provided index is valid by wrapping it.
        const clampedIndex = newIndex % this.sections.length;
        this.playingSectionIndex = clampedIndex;

        const playingSection = this.sections[this.playingSectionIndex];
        if (!playingSection) {
            console.error(`VibeSeq Error: Tried to switch to an invalid section index: ${clampedIndex}`);
            this.stop();
            return;
        }

        // Update playback BPM for the new section
        const newBpm = playingSection.bpm || 120;
        if (this.bpm !== newBpm) {
            this.bpm = newBpm;
            this.bar = 60 / this.bpm * this.beatsInBar;
            this.barDuration = this.bar;

            if (this.clockNode) {
                this.clockNode.port.postMessage({ type: 'setBPM', bpm: newBpm });
            }
        }

        // Reset section timing for a fresh start on the new section
        if (this.isPlaying) {
            this.sectionStartTime = this.audioContext.currentTime;
        }
        this.sectionRepeatCount = 0;

        // Re-initialize track states for the new section's patterns
        this.updateTrackStates();

        // Update maxSteps for the new section
        this.maxSteps = Math.max(...playingSection.tracks.map(track => this.calculatePatternLength(track.pattern)));

        // Notify sequencer/UI of the change so it can follow if needed
        if (this.onSectionChange) {
            this.onSectionChange(this.playingSectionIndex);
        }
    }
}