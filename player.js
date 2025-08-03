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
        if (this.bpm !== newBpm) {
            this.bpm = newBpm;
            this.bar = 60 / this.bpm * this.beatsInBar;
            this.barDuration = this.bar;

            if (this.clockNode) {
                this.clockNode.port.postMessage({ type: 'setBPM', bpm: newBpm });
            }
        }

        this.updateTrackStates();

        // Update maxSteps for the new section
        this.maxSteps = Math.max(...playingSection.tracks.map(track => this.calculatePatternLength(track.pattern)));

        // Notify sequencer of section change
        if (this.onSectionChange) {
            this.onSectionChange(this.playingSectionIndex);
        }
    }

    setOnSectionChange(callback) {
        this.onSectionChange = callback;
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
            const correctStepIndex = flatSteps.findIndex(
                step => currentPatternPosition >= step.startTime - 0.01 && currentPatternPosition < step.endTime
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
            if (currentStep && currentPatternPosition <= currentStep.startTime + 0.01) {
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
            this.playingSectionIndex = 0; // this.currentSectionIndex;
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


            console.log("Section repeat count:", this.sectionRepeatCount, "Required repeats:", requiredRepeats);

            // Check if we've completed all required repeats
            if (this.sectionRepeatCount > 0 && this.sectionRepeatCount >= requiredRepeats) {
                // We've completed all required repeats, advance to next section
                this.advancePlayingSection();
                this.sectionStartTime = now; // Reset section start time
                this.sectionRepeatCount = 0;
            } else {
                // Still have more repeats to go, reset timing for next repeat
                this.sectionStartTime = now; // Reset section timing for next repeat
            }

            // After section changes, recalculate pattern position for the new/continuing section
            sectionElapsedTime = now - this.sectionStartTime;
            patternPosition = sectionElapsedTime % this.bar;
            this.currentLoop++;
        }

        const currentIndex = Math.floor(patternPosition / (this.bar / this.maxSteps));

        if (this.currentStep !== currentIndex) {
            this.updatePlayhead(currentIndex);
            this.currentStep = currentIndex;
        }

        // Use playing section for actual playback
        const playingSection = this.sections[this.playingSectionIndex];

        this.trackStates.forEach((state, i) => {
            const track = playingSection.tracks[i];
            if (!track) return; // Safety check

            let correctStepIndex = state.index;

            // Simple and clear: startTime + duration = end time
            const currentStep = state.flatSteps[state.index];
            if (!currentStep) return; // Safety check

            if (patternPosition >= currentStep.startTime && patternPosition < currentStep.endTime && !state.hasFired) {
                const step = currentStep;
                const defaults = track.defaults;

                let lucky = true;
                if((track.defaults && track.defaults.odds) || step.odds) {
                    const randomValue = Math.random();
                    const odds = step.odds || track.defaults.odds || 1.0;
                    console.log(odds, randomValue);
                    if( randomValue > odds) {
                        lucky = false;
                    }
                }

                let modded = true;
                if((track.defaults && track.defaults.mod) || step.mod) {
                    const mod = step.mod || track.defaults.mod || 1;
                    if( this.currentLoop % mod !== 0) {
                        modded = false;
                    }
                }

                if (step && step.fire && !track.playback?.muted && lucky && modded) {
                     
                    const note = step.note ?? defaults.note;
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
                if (state.index >= state.flatSteps.length-1) {
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
        this.playingSectionIndex = 0; //this.currentSectionIndex;
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

    setTempo(bpm) {
        this.bpm = bpm;

        // Update the BPM for the section that's currently being edited in the UI
        if (this.sequencer && this.sequencer.currentSection) {
            this.sequencer.currentSection.bpm = bpm;
        }

        this.bar = 60 / bpm * 4;
        this.barDuration = this.bar / 4;

        if (this.clockNode) {
            this.clockNode.port.postMessage({ type: 'setBPM', bpm });
        }

        console.log(`Tempo changed to ${bpm} BPM`);
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
        // Only show playhead if we have a sequencer reference and conditions are met
        if (this.sequencer) {
            // Show playhead only if:
            // 1. User is following playback (normal case), OR
            // 2. User is viewing the currently playing section (even if not following)
            const shouldShowPlayhead = this.sequencer.isFollowingPlayback ||
                (this.sequencer.currentSectionIndex === this.playingSectionIndex);

            if (shouldShowPlayhead) {
                document.querySelectorAll('.index-step').forEach((el, index) => {
                    el.classList.toggle('current', index === stepIndex);
                });
            } else {
                // Hide playhead when viewing different section and not following
                document.querySelectorAll('.index-step').forEach((el) => {
                    el.classList.remove('current');
                });
            }
        } else {
            // Fallback: always show if no sequencer reference
            document.querySelectorAll('.index-step').forEach((el, index) => {
                el.classList.toggle('current', index === stepIndex);
            });
        }
    }

    setSequencer(sequencer) {
        this.sequencer = sequencer;
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
}