class DataSequencer {

    constructor(container, player) {
        this.container = container;
        this.player = player;
        this.data = player.sections;
        this.currentSectionIndex = 0;
        this.currentSection = this.data[this.currentSectionIndex];
        this.isFollowingPlayback = false;
        this.asciiParser = new ASCIINotationParser();
        this.selection = {
            type: 'none',
            trackIndex: -1,
            stepIndices: new Set(),
            subdivisionPath: null
        };
        this.isShiftPressed = false;
        this.maxSteps = 0;
        this.selectionChanged = false;

        // Set up callback for when player advances sections
        this.player.setOnSectionChange((newSectionIndex) => {
            this.onPlaybackSectionChange(newSectionIndex);
        });

        this.init();
    }

    onPlaybackSectionChange(newSectionIndex) {
        if (this.isFollowingPlayback) {
            // Follow the playback to the new section
            this.switchToSection(newSectionIndex);
        } else {
            // this.render("onPlaybackSectionChange");
            // TODO: Use query selector?
        }
    }

    toggleFollowing() {
        this.isFollowingPlayback = !this.isFollowingPlayback;

        const followButton = document.getElementById('follow-button');
        if (followButton) {
            followButton.classList.toggle('active', !this.isFollowingPlayback);
            followButton.textContent = this.isFollowingPlayback ? 'Unfollow' : 'Follow';
        }

        // If enabling following, immediately switch to playing section
        if (this.isFollowingPlayback && this.player.isPlaying) {
            this.switchToSection(this.player.playingSectionIndex);
        }
    }

    init() {
        this.setupEventListeners();
        this.setupSectionEventListeners();

        // Set initial context mode class
        this.updateContextModeBodyClass();

        this.render("init");
        this.updateContextMenu();
    }

    updateContextModeBodyClass() {
        // Remove all existing context mode classes
        document.body.classList.remove('rhythm-mode', 'melody-mode', 'section-mode');

        // Get the currently active context tab
        const activeTab = document.querySelector('.context-tab.active');
        if (activeTab) {
            const tabMode = activeTab.getAttribute('data-tab');
            document.body.classList.add(`${tabMode}-mode`);
        }
    }
    setupSectionEventListeners() {
        // Section name input
        $('section-name-input').addEventListener('input', (e) => {
            this.currentSection.name = e.target.value;
            this.render("setupSectionEventListeners"); // Re-render to update section tab name
        });

        // Section repeat input
        $('section-repeat-input').addEventListener('input', (e) => {
            const repeat = parseInt(e.target.value) || 1;
            this.currentSection.repeat = Math.max(1, Math.min(99, repeat));
            e.target.value = this.currentSection.repeat;
        });

        // Section BPM input
        $('section-bpm-input').addEventListener('input', (e) => {
            const bpm = parseInt(e.target.value) || 120;
            this.currentSection.bpm = Math.max(60, Math.min(200, bpm));
            e.target.value = this.currentSection.bpm;

            // Update main tempo input and player if this is the current section
            const tempoInput = document.getElementById('tempo');
            if (tempoInput) {
                tempoInput.value = this.currentSection.bpm;
            }

            // Update player BPM
            this.player.setTempo(this.currentSection.bpm);
        });

        // Clone section button
        $('clone-section-button').addEventListener('click', (e) => {
            e.stopPropagation();
            this.cloneCurrentSection();
        });

        $('clone-track-button').addEventListener('click', (e) => {
            e.stopPropagation();
            this.cloneSelectedTrack();
        });

        $('clear-section-button').addEventListener('click', (e) => {
            e.stopPropagation();
            this.confirmClearSection();
        });

        $('clear-all-button').addEventListener('click', (e) => {
            e.stopPropagation();
            this.confirmClearAll();
        });

    }

    confirmClearSection() {
        this.pendingClearAction = 'section';

        $('confirm-title').textContent = 'Clear Section';
        $('confirm-message').textContent = `Are you sure you want to clear all patterns in "${this.currentSection.name}"? This will reset all tracks to empty patterns but keep the track structure.`;
        $('confirm-dialog').classList.add('show');
    }

    confirmClearAll() {
        this.pendingClearAction = 'all';

        $('confirm-title').textContent = 'Clear All Sections';
        $('confirm-message').textContent = `Are you sure you want to clear all patterns in ALL sections? This will reset every track in every section to empty patterns but keep all section and track structures.`;
        $('confirm-dialog').classList.add('show');
    }

    newEmptyTrack = () => ({
        name: "Track 1",
        defaults: {
            note: 36,
            channel: 9,
            velocity: 100
        },
        playback: { muted: false },
        pattern: [
            { type: "step", fire: 0 },
            { type: "step", fire: 0 },
            { type: "step", fire: 0 },
            { type: "step", fire: 0 },
            { type: "step", fire: 0 },
            { type: "step", fire: 0 },
            { type: "step", fire: 0 },
            { type: "step", fire: 0 },
            { type: "step", fire: 0 },
            { type: "step", fire: 0 },
            { type: "step", fire: 0 },
            { type: "step", fire: 0 },
            { type: "step", fire: 0 },
            { type: "step", fire: 0 },
            { type: "step", fire: 0 },
            { type: "step", fire: 0 }
        ],
        operations: { euclidean: { steps: 16, pulses: 0 }, rotate: 1 },
        layout: { minimized: false, selected: false }
    });

    clearCurrentSection() {

        // Replace all tracks with the single new track
        this.currentSection.tracks = [this.newEmptyTrack()];

        // Clear selection and update
        this.clearSelection();
        this.player.updateTrackStates();
        this.render("clearCurrentSection");
        this.updateContextMenu();

        console.log(`Cleared section "${this.currentSection.name}" - removed all tracks, left one empty track`);
    }

    clearAllSections() {
        // Create a fresh Section 1 with one empty track
        const freshSection = {
            name: "Section 1",
            bpm: 120,
            repeat: 1,
            tracks: [this.newEmptyTrack()]
        };

        // Replace all sections with just the fresh Section 1
        this.data = [freshSection];
        this.player.sections = this.data;

        console.log(this.data);

        // Reset to Section 1
        this.currentSectionIndex = 0;
        this.currentSection = this.data[0];
        this.player.currentSectionIndex = 0;
        this.player.currentSection = this.data[0];
        this.player.playingSectionIndex = 0;

        // Clear selection and reset following
        this.clearSelection();
        this.isFollowingPlayback = true;

        // Update player and UI
        this.player.updateTrackStates();
        this.render("clearAllSections");
        this.updateContextMenu();

    }

    clearTrackPattern(track) {
        // Reset pattern to default length with all inactive steps
        const currentLength = track.pattern.length;
        track.pattern = Array.from({ length: currentLength }, () => ({
            type: "step",
            fire: 0
        }));

        // Reset euclidean operations
        if (track.operations && track.operations.euclidean) {
            track.operations.euclidean.pulses = 0;
        }
    }

    cloneSelectedTrack() {
        if (this.selection.type !== 'track') {
            console.warn('No track selected for cloning');
            return;
        }

        const trackIndex = this.selection.trackIndex;

        if (trackIndex < 0 || trackIndex >= this.currentSection.tracks.length) {
            console.warn('Invalid track index for cloning');
            return;
        }

        // Use the existing cloneTrack method
        this.cloneTrack(trackIndex);

        // Re-render and update context menu
        this.render("cloneSelectedTrack");
        this.updateContextMenu();
    }

    switchToSection(sectionIndex) {
        if (sectionIndex < 0 || sectionIndex >= this.data.length) return;

        // Simple section switching - always update UI
        this.currentSectionIndex = sectionIndex;
        this.currentSection = this.data[sectionIndex];

        // Update player's current section for UI purposes (tempo sync, etc.)
        this.player.currentSectionIndex = sectionIndex;
        this.player.currentSection = this.data[sectionIndex];

        // DO NOT update playingSectionIndex or track states when just browsing sections
        // The playingSectionIndex should only be updated by the audio player itself during playback
        // or when starting playback from a stopped state

        // Clear selection when switching sections
        this.clearSelection();

        // Re-render everything
        this.render("switchToSection");
        this.updateContextMenu();

    }

    showSectionControls() {
        const sectionControls = document.getElementById('section-controls');
        if (sectionControls) {
            sectionControls.style.display = 'block';
        }
    }

    hideSectionControls() {
        const sectionControls = document.getElementById('section-controls');
        if (sectionControls) {
            sectionControls.style.display = 'none';
        }
    }

    createNewSection() {
        const newSectionIndex = this.data.length + 1;
        const newSection = {
            name: `Section ${newSectionIndex}`,
            bpm: 120,
            repeat: 1,
            tracks: [
                {
                    name: "Track 1",
                    defaults: {
                        note: 36,
                        channel: 9,
                        velocity: 100
                    },
                    playback: { muted: false },
                    pattern: [
                        { type: "step", fire: 0 },
                        { type: "step", fire: 0 },
                        { type: "step", fire: 0 },
                        { type: "step", fire: 0 }
                    ],
                    operations: { euclidean: { steps: 4, pulses: 1 }, rotate: 0 },
                    layout: { minimized: false }
                }
            ]
        };

        this.data.push(newSection);

        // Update player's sections array
        this.player.sections = this.data;

        // Switch to the new section
        this.switchToSection(this.data.length - 1);
    }

    cloneCurrentSection() {
        const clonedSection = JSON.parse(JSON.stringify(this.currentSection));

        // Generate a unique name
        const baseName = this.currentSection.name.replace(/ \(\d+\)$/, '');
        let newIndex = 2;
        let newName = baseName + ' (' + newIndex + ')';

        while (this.data.some(section => section.name === newName)) {
            newIndex++;
            newName = baseName + ' (' + newIndex + ')';
        }

        clonedSection.name = newName;

        // Clear any layout selection states
        clonedSection.tracks.forEach(track => {
            if (track.layout) {
                track.layout.selected = false;
            }
        });

        this.data.push(clonedSection);

        // Update player's sections array
        this.player.sections = this.data;

        // Switch to the new cloned section
        this.switchToSection(this.data.length - 1);
    }


    confirmRemoveSection(sectionIndex) {
        if (this.data.length <= 1) {
            alert('Cannot remove the last section');
            return;
        }

        const section = this.data[sectionIndex];
        this.pendingRemoveSectionIndex = sectionIndex;

        $('confirm-title').textContent = 'Remove Section';
        $('confirm-message').textContent = `Are you sure you want to remove "${section.name}"? This cannot be undone.`;
        $('confirm-dialog').classList.add('show');
    }

    // Method to actually remove a section
    removeSection(sectionIndex) {
        if (this.data.length <= 1) return;

        this.data.splice(sectionIndex, 1);

        // Adjust current section index if needed
        if (this.currentSectionIndex >= sectionIndex) {
            this.currentSectionIndex = Math.max(0, this.currentSectionIndex - 1);
        }

        // Switch to the adjusted section
        this.switchToSection(this.currentSectionIndex);
    }

    createSectionTabs() {
        const sectionInfo = this.player.getSectionInfo();

        const sectionTabs = this.data.map((section, index) => {
            const isActive = index === this.currentSectionIndex;
            const isPlaying = sectionInfo.isPlaying && index === sectionInfo.playingIndex;
            const isFollowing = this.isFollowingPlayback && isPlaying;
            const canRemove = this.data.length > 1;

            // Determine tab classes
            let tabClasses = 'section-tab';
            if (isActive) tabClasses += ' active';
            if (isPlaying) tabClasses += ' playing';
            if (isFollowing) tabClasses += ' following';

            return `
            <div class="${tabClasses}" data-section="${index}">
                <div class="section-tab-name">
                    ${section.name}
                </div>
                ${canRemove ? `<button class="section-tab-close" data-section="${index}" onclick="event.stopPropagation()">×</button>` : ''}
            </div>
        `;
        }).join('');

        const shadowTab = `
        <div class="shadow-section-tab" id="add-section-tab">
            + Add Section
        </div>
    `;

        return `
        <div class="section-tabs">
            ${sectionTabs}
            ${shadowTab}
        </div>
    `;
    }

    attachSectionTabListeners() {
        // Section tab click handlers
        document.querySelectorAll('.section-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                if (e.target.classList.contains('section-tab-close')) {
                    return; // Don't switch sections when clicking close button
                }

                const sectionIndex = parseInt(tab.getAttribute('data-section'));
                this.switchToSection(sectionIndex);
            });
        });

        // Section close button handlers
        document.querySelectorAll('.section-tab-close').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const sectionIndex = parseInt(button.getAttribute('data-section'));
                this.confirmRemoveSection(sectionIndex);
            });
        });

        // Add section tab handler
        const addSectionTab = document.getElementById('add-section-tab');
        if (addSectionTab) {
            addSectionTab.addEventListener('click', () => {
                this.createNewSection();
            });
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            // Don't interfere with typing in input fields
            if (e.target.tagName === 'INPUT') {
                if (e.key === 'Enter' &&
                    (e.target.classList.contains('track-length-input')
                        || e.target.classList.contains('track-euclidean-pulses-input')
                        || e.target.classList.contains('track-rotate-input')
                    )) {
                    e.target.blur();
                }
                return;
            }

            // Main sequencer keyboard shortcuts
            if (e.key === 'Shift') {
                this.isShiftPressed = true;
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (this.isShiftPressed) {
                    this.extendSelectionIfExists(-1);
                } else {
                    this.moveSelection(-1);
                }
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (this.isShiftPressed) {
                    this.extendSelectionIfExists(1);
                } else {
                    this.moveSelection(1);
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.isCurrentTabMelody() && this.selection.type !== 'none') {
                    this.changePitchSelectionIndividually(1);
                } else if (this.isCurrentTabRhythm() && this.selection.type !== 'none') {
                    this.changeVelocitySelection(1);
                } else {
                    this.moveSelectionVertical(-1);
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.isCurrentTabMelody() && this.selection.type !== 'none') {
                    this.changePitchSelectionIndividually(-1);
                } else if (this.isCurrentTabRhythm() && this.selection.type !== 'none') {
                    this.changeVelocitySelection(-1);
                } else {
                    this.moveSelectionVertical(1);
                }
            } else if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                this.applyInverse();
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                this.clearStepProperties();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.clearSelection();
                this.render("setupEventListeners: Escape");
                this.updateContextMenu();
            } else if (this.isNumberKey(e.key)) {
                e.preventDefault();
                const number = this.parseNumberAndTE(e.key);

                if (this.isCurrentTabRhythm() || this.isCurrentTabSection()) {
                    this.createQuickSubdivision(number);
                } else if (this.isCurrentTabMelody()) {
                    this.setPitchNumber(number);
                }
            }
        });

        // Context menu tab handling
        document.querySelectorAll('.context-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.target.getAttribute('data-tab');

                // Remove active class from all tabs and panels
                document.querySelectorAll('.context-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.context-tab-panel').forEach(p => p.classList.remove('active'));

                // Add active class to clicked tab and corresponding panel
                e.target.classList.add('active');
                document.getElementById(`${targetTab}-panel`).classList.add('active');

                // Update body class for context mode styling
                this.updateContextModeBodyClass();

                // Re-render to update step colors and pitch visualizations
                this.render("setupEventListeners: context tab click");
            });
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') this.isShiftPressed = false;
        });

        document.addEventListener('click', this.handleGlobalClick.bind(this));
        this.container.addEventListener('contextmenu', this.handleRightClick.bind(this));

        // Help modal event listeners
        $('help-button').addEventListener('click', () => this.showHelpModal());
        $('help-close').addEventListener('click', () => this.hideHelpModal());

        // Context menu event listeners
        $('note-input').addEventListener('input', () => this.applyNote());
        $('channel-input').addEventListener('input', () => this.applyChannel());
        $('velocity-input').addEventListener('input', () => this.applyVelocity());
        $('mod-input').addEventListener('input', () => this.applyMod());
        $('odds-input').addEventListener('input', () => this.applyOdds());
        $('pitch-input').addEventListener('input', () => this.applyPitch());
        $('octave-input').addEventListener('input', () => this.applyOctave());
        $('scale-input').addEventListener('input', () => this.applyScale());
        $('inverse-button').addEventListener('click', () => this.applyInverse());
        $('rotate-left-button').addEventListener('click', () => this.applyRotate(-1));
        $('rotate-right-button').addEventListener('click', () => this.applyRotate(1));
        $('subdivide-button').addEventListener('click', () => this.showSubdivisionControls());
        $('break-subdivision-button').addEventListener('click', () => this.breakSubdivision());
        $('create-subdivision').addEventListener('click', () => this.createSubdivision());
        $('cancel-subdivision').addEventListener('click', () => this.hideSubdivisionControls());
        $('clear-button').addEventListener('click', () => this.clearStepProperties());

        // JSON modal event listeners
        $('json-button').addEventListener('click', () => this.showJsonModal());
        $('json-close').addEventListener('click', () => this.hideJsonModal());
        $('json-copy').addEventListener('click', () => this.copyJsonData());

        $('import-button').addEventListener('click', () => this.showImportModal());
        $('import-close').addEventListener('click', () => this.hideImportModal());
        $('import-execute').addEventListener('click', () => this.importData());
        $('import-clear').addEventListener('click', () => this.clearImportData());

        // MIDI modal event listeners
        $('midi-button').addEventListener('click', () => this.showMidiModal());
        $('midi-close').addEventListener('click', () => this.hideMidiModal());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideHelpModal();
                this.hideJsonModal();
                this.hideImportModal();
                this.hideMidiModal();
            }
        });

        // FIXED: Track control event listeners - make sure these are properly bound
        if (this.handleTrackControlInput) {
            this.container.addEventListener('input', this.handleTrackControlInput.bind(this));
        }

        if (this.handleTrackControlChange) {
            this.container.addEventListener('change', this.handleTrackControlChange.bind(this));
        }

        if (this.handleTrackControlClick) {
            this.container.addEventListener('click', this.handleTrackControlClick.bind(this));
            console.log('Track control click listener added'); // Debug log
        } else {
            console.error('handleTrackControlClick method not found!');
        }

        if (this.handleTrackControlFocus) {
            this.container.addEventListener('focus', this.handleTrackControlFocus.bind(this), true);
            console.log('Focus listener added');
        } else {
            console.error('handleTrackControlFocus method not found!');
        }

        // Confirmation dialog listeners
        $('confirm-yes').addEventListener('click', () => this.handleConfirmYes());
        $('confirm-no').addEventListener('click', () => this.hideConfirmDialog());
    }

    showMidiModal() {
        $('midi-modal').classList.add('show');
    }

    hideMidiModal() {
        $('midi-modal').classList.remove('show');
    }

    // Show help modal
    showHelpModal() {
        $('help-modal').classList.add('show');
    }

    // Hide help modal
    hideHelpModal() {
        $('help-modal').classList.remove('show');
    }

    // Add help modal HTML to the main template (add this to your HTML)
    getHelpModalHTML() {
        return `
        <!-- Help Modal -->
        <div id="help-modal" class="modal">
            <div id="help-content" class="modal-content">
                <div id="help-header" class="modal-header">
                    <h2 id="help-title">Sequencer Help</h2>
                    <button id="help-close" class="modal-close-button">×</button>
                </div>
                <div id="help-display" class="modal-body">
                    <div class="help-section">
                        <h3>Modes</h3>
                        <div class="help-content">
                            <div class="help-item">
                                <strong>Rhythm Mode:</strong> Edit step timing and activation
                                <ul>
                                    <li>Left click: Toggle step on/off</li>
                                    <li>Steps show as red (active) or grey (inactive)</li>
                                </ul>
                            </div>
                            <div class="help-item">
                                <strong>Melody Mode:</strong> Edit pitch and musical content
                                <ul>
                                    <li>Left click: Set pitch based on click height</li>
                                    <li>Click same pitch again: Turn step off</li>
                                    <li>Bottom 10% of step: Turn step off</li>
                                    <li>Red bars show pitch height</li>
                                    <li>Orange bars show track default pitch</li>
                                    <li>Blue dots indicate steps with custom properties</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="help-section">
                        <h3>Selection & Navigation</h3>
                        <div class="help-content">
                            <div class="help-item">
                                <strong>Selection:</strong>
                                <ul>
                                    <li><kbd>Left Click</kbd>: Select single step</li>
                                    <li><kbd>Shift + Click</kbd>: Extend selection</li>
                                    <li><kbd>Right Click</kbd>: Context menu or clear selection</li>
                                    <li><kbd>Esc</kbd>: Clear selection</li>
                                </ul>
                            </div>
                            <div class="help-item">
                                <strong>Navigation:</strong>
                                <ul>
                                    <li><kbd>←→</kbd>: Move selection left/right</li>
                                    <li><kbd>↑↓</kbd>: Move selection up/down (tracks)</li>
                                    <li><kbd>Shift + ←→</kbd>: Extend selection</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="help-section">
                        <h3>Rhythm Mode Shortcuts</h3>
                        <div class="help-content">
                            <div class="help-item">
                                <ul>
                                    <li><kbd>Space</kbd>: Inverse selection (toggle all selected steps)</li>
                                    <li><kbd>Backspace</kbd>: Clear step properties</li>
                                    <li><kbd>0-9, T, E</kbd>: Create quick subdivision</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="help-section">
                        <h3>Melody Mode Shortcuts</h3>
                        <div class="help-content">
                            <div class="help-item">
                                <ul>
                                    <li><kbd>↑↓</kbd>: Change pitch of selected steps individually</li>
                                    <li><kbd>0-9, T, E</kbd>: Set pitch to specific value (0-11)</li>
                                    <li><kbd>Space</kbd>: Inverse selection</li>
                                    <li><kbd>Backspace</kbd>: Clear step properties</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="help-section">
                        <h3>Track Controls</h3>
                        <div class="help-content">
                            <div class="help-item">
                                <strong>Track Selection:</strong>
                                <ul>
                                    <li>Click track header to select entire track</li>
                                    <li>Changes affect track defaults and existing explicit values</li>
                                    <li>Arrow keys: Change defaults + any explicit step values</li>
                                    <li>Numbers: Set same value to defaults + explicit step values</li>
                                </ul>
                            </div>
                            <div class="help-item">
                                <strong>Track Operations:</strong>
                                <ul>
                                    <li><kbd>▲/▼</kbd>: Minimize/maximize track</li>
                                    <li><kbd>×</kbd>: Remove track (with confirmation)</li>
                                    <li><kbd>Clone</kbd>: Duplicate track</li>
                                    <li>Length controls: Adjust track length (1-32 steps)</li>
                                    <li>Pulses controls: Generate Euclidean rhythms</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="help-section">
                        <h3>Subdivisions</h3>
                        <div class="help-content">
                            <div class="help-item">
                                <ul>
                                    <li>Select steps and use "Subdivide" to create subdivisions</li>
                                    <li>Numbers in rhythm mode create quick subdivisions</li>
                                    <li>"Break Subdivision" removes subdivision structure</li>
                                    <li>Subdivisions can be nested multiple levels deep</li>
                                    <li>Labels show original steps / subdivision count</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="help-section">
                        <h3>Context Menu</h3>
                        <div class="help-content">
                            <div class="help-item">
                                <strong>Properties:</strong> Note, Channel, Velocity, Mod, Odds
                            </div>
                            <div class="help-item">
                                <strong>Melody Controls:</strong> Pitch, Octave, Scale
                            </div>
                            <div class="help-item">
                                <strong>Operations:</strong> Inverse, Rotate, Subdivide, Clear
                            </div>
                        </div>
                    </div>

                    <div class="help-section">
                        <h3>General Shortcuts</h3>
                        <div class="help-content">
                            <div class="help-item">
                                <ul>
                                    <li><kbd>F1</kbd> or <kbd>?</kbd>: Show this help</li>
                                    <li><kbd>Esc</kbd>: Close modals and clear selection</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    }

    handleClick(e) {
        const target = e.target;
        const action = this.parseAction(target);

        const hadSelection = this.selection.type !== 'none';
        const previousSelectionStr = JSON.stringify(this.selection);

        this.selectionChanged = false;

        if (!action || (!action.type)) {
            if (hadSelection) {
                this.clearSelection();
                this.render("handleClick: selection, no action");
                this.updateContextMenu();
            }
            return;
        }

        switch (action.type) {
            case 'step':
                if (this.isShiftPressed) {
                    this.handleShiftClick(action);
                } else {
                    // Always clear previous selection and select the clicked step
                    this.clearSelection();
                    this.selectSingleStep(action);
                    this.selectionChanged = true;

                    // Check if track is minimized
                    const track = this.currentSection.tracks[action.track];
                    const isMinimized = track.layout?.minimized;

                    if (this.isCurrentTabMelody() && !isMinimized) {
                        // In melody mode with maximized track, handle as melody click
                        this.handleMelodyClick(e, action);
                    } else if (this.isCurrentTabRhythm() && !isMinimized) {
                        // In rhythm mode (regardless of minimized state), handle velocity click
                        this.handleVelocityClick(e, action);
                    } else {
                        // Fallback - just toggle the step
                        this.toggleStep(action.track, action.step, action.subdivisionPath);
                    }
                }
                break;

            case 'minimize':
                this.toggleMinimize(action.track);
                break;

            case 'header':
                this.clearSelection();
                this.selectTrack(action.track);
                this.selectionChanged = true;
                break;

            case 'index':
                if (hadSelection) {
                    this.clearSelection();
                    this.selectionChanged = true;
                }
                break;
        }

        const currentSelectionStr = JSON.stringify(this.selection);
        if (hadSelection && currentSelectionStr === previousSelectionStr && !this.selectionChanged && !this.isShiftPressed) {
            this.clearSelection();
        }

        this.render("handleClick");
        this.updateContextMenu();
    }

    selectSingleStep(action) {
        if (action.subdivisionPath && action.subdivisionPath.length > 0) {
            // For subdivision steps
            const fullPath = [action.step, ...action.subdivisionPath];

            this.selection = {
                type: 'subdivision',
                trackIndex: action.track,
                stepIndices: new Set([action.step]),
                subdivisionPath: fullPath
            };
        } else {
            // For regular steps
            this.selection = {
                type: 'steps',
                trackIndex: action.track,
                stepIndices: new Set([action.step]),
                subdivisionPath: null
            };
        }
    }

    handleGlobalClick(e) {
        this.selectionChanged = false;
        const hadSelection = this.selection.type !== 'none';

        if (e.target.closest('#sequencer')) {
            this.handleClick(e);
        } else if (e.target.closest('#context-menu') || e.target.closest('#midi-modal') || e.target.closest('#json-modal')) {
            return;
        } else {
            if (hadSelection) {
                this.clearSelection();
                this.render("handleGlobalClick: outside sequencer");
                this.updateContextMenu();
            }
        }
    }

    updateContextMenuInputsFromSelection() {
        let firstStep = null;
        let track = null;

        switch (this.selection.type) {
            case 'track':
                track = this.currentSection.tracks[this.selection.trackIndex];
                $('pitch-input').value = track.defaults.pitch || 0;
                $('note-input').value = track.defaults.note || 36;
                $('octave-input').value = track.defaults.octave || 3;
                $('scale-input').value = track.defaults.scale || 4095;
                break;

            case 'steps':
                firstStep = this.getFirstSelectedStep();
                track = this.currentSection.tracks[this.selection.trackIndex];
                if (firstStep) {
                    $('pitch-input').value = firstStep.pitch || 0;
                    $('note-input').value = firstStep.note || track.defaults.note;
                    $('octave-input').value = firstStep.octave || track.defaults.octave || 3;
                    $('scale-input').value = firstStep.scale || track.defaults.scale || 4095;
                }
                break;

            case 'subdivision':
                track = this.currentSection.tracks[this.selection.trackIndex];
                const subdivision = this.navigateToSubdivision(this.selection.trackIndex, this.selection.subdivisionPath);

                if (subdivision) {
                    if (subdivision.type === 'step') {
                        // Single step subdivision
                        $('pitch-input').value = subdivision.pitch || 0;
                        $('note-input').value = subdivision.note || track.defaults.note;
                        $('octave-input').value = subdivision.octave || track.defaults.octave || 3;
                        $('scale-input').value = subdivision.scale || track.defaults.scale || 4095;
                    } else if (subdivision.subdivide && subdivision.pattern) {
                        // Subdivision container - find first active step
                        const firstActiveStep = this.getFirstActiveStepInPattern(subdivision.pattern);
                        if (firstActiveStep) {
                            $('pitch-input').value = firstActiveStep.pitch || 0;
                            $('note-input').value = firstActiveStep.note || track.defaults.note;
                            $('octave-input').value = firstActiveStep.octave || track.defaults.octave || 3;
                            $('scale-input').value = firstActiveStep.scale || track.defaults.scale || 4095;
                        } else {
                            // No active steps, use track defaults
                            $('pitch-input').value = track.defaults.pitch || 0;
                            $('note-input').value = track.defaults.note || 36;
                            $('octave-input').value = track.defaults.octave || 3;
                            $('scale-input').value = track.defaults.scale || 4095;
                        }
                    }
                }
                break;

            case 'subdivision-steps':
                firstStep = this.getFirstSelectedSubdivisionStep();
                track = this.currentSection.tracks[this.selection.trackIndex];
                if (firstStep) {
                    $('pitch-input').value = firstStep.pitch || 0;
                    $('note-input').value = firstStep.note || track.defaults.note;
                    $('octave-input').value = firstStep.octave || track.defaults.octave || 3;
                    $('scale-input').value = firstStep.scale || track.defaults.scale || 4095;
                }
                break;
        }
    }

    stepHasVelocity(step, track) {
        if (!this.isCurrentTabRhythm()) return false;

        // Show velocity visualization if step is active
        if (step.fire === 1) {
            return true; // Always show velocity for active steps
        }

        return false;
    }

    getVelocityHeight(step, track) {
        if (!this.isCurrentTabRhythm() || step.fire !== 1) return null;

        let velocity;

        // Get velocity value - priority order: step.velocity > track.defaults.velocity > 100
        if (step.velocity !== undefined) {
            velocity = step.velocity;
        } else if (track.defaults.velocity !== undefined) {
            velocity = track.defaults.velocity;
        } else {
            velocity = 100; // Final fallback
        }

        // Clamp velocity to valid range (1-127)
        const clampedVelocity = Math.max(1, Math.min(127, velocity));

        // Calculate height percentage (10% minimum, 100% maximum)
        const heightPercent = (clampedVelocity / 127) * 90 + 10;

        return heightPercent;
    }

    handleVelocityClick(e, action) {
        const stepElement = e.target.closest('.step, .subdivision-step');
        if (!stepElement) return;

        const rect = stepElement.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const stepHeight = rect.height;

        // Calculate velocity based on click position (bottom = 1, top = 127)
        const clickRatio = 1 - (clickY / stepHeight);

        const clickedStep = this.getStepFromAction(action);
        const track = this.currentSection.tracks[action.track];

        if (!clickedStep) return;

        let targetVelocity, shouldActivate;

        // If clicking at very bottom (bottom 10%), turn off the step
        if (clickRatio < 0.1) {
            shouldActivate = false;
            targetVelocity = undefined;
        } else {
            // Calculate velocity from click position (1-127)
            const calculatedVelocity = Math.round(clickRatio * 126) + 1; // Ensure range 1-127

            // Check if step is already active with this velocity
            if (clickedStep.fire === 1) {
                // Get current velocity of the step (including defaults)
                let currentVelocity;
                if (clickedStep.velocity !== undefined) {
                    currentVelocity = clickedStep.velocity;
                } else if (track.defaults.velocity !== undefined) {
                    currentVelocity = track.defaults.velocity;
                } else {
                    currentVelocity = 100; // Final fallback
                }

                // If clicking the same velocity (within tolerance), toggle the step off
                if (Math.abs(calculatedVelocity - currentVelocity) <= 5) { // 5 velocity tolerance
                    shouldActivate = false;
                    targetVelocity = undefined;
                } else {
                    // Different velocity - set new velocity
                    shouldActivate = true;
                    targetVelocity = calculatedVelocity;
                }
            } else {
                // Step is inactive - activate with new velocity
                shouldActivate = true;
                targetVelocity = calculatedVelocity;
            }
        }

        // Play note preview if activating and player is stopped
        if (shouldActivate && targetVelocity !== undefined && !this.player.isPlaying) {
            const note = clickedStep.note || track.defaults.note;
            const channel = clickedStep.channel || track.defaults.channel || 9;
            this.playNotePreview(note, channel - 1, targetVelocity);
        }

        // Apply to the specific clicked step
        this.applyVelocityToSpecificStep(action, targetVelocity, shouldActivate);

        // Update context menu to reflect changes
        this.updateContextMenuInputsFromSelection();

        this.player.updateTrackStates();
    }

    changeVelocityInPatternExplicitValues(pattern, track, velocityChange) {
        pattern.forEach(step => {
            if (step.type === 'step') {
                // Only change if the step has explicit velocity values
                if (step.velocity !== undefined) {
                    const newVelocity = Math.max(1, Math.min(127, step.velocity + velocityChange));
                    step.velocity = newVelocity;
                }
                // If no explicit velocity, leave it alone (will use defaults)
            } else if (step.subdivide && step.pattern) {
                // Recursively process subdivisions
                this.changeVelocityInPatternExplicitValues(step.pattern, track, velocityChange);
            }
        });
    }

    changeVelocityInTrackExplicitValues(track, velocityChange) {
        this.changeVelocityInPatternExplicitValues(track.pattern, track, velocityChange);
    }

    changeVelocitySelection(direction) {
        if (this.selection.type === 'none') return;

        // Calculate velocity change (direction * 10 for bigger increments)
        const velocityChange = direction * 10;

        // Store preview info for single selections only
        let previewNote = null;
        let previewChannel = null;
        let previewVelocity = null;

        switch (this.selection.type) {
            case 'track':
                const track = this.currentSection.tracks[this.selection.trackIndex];
                const currentVelocity = track.defaults.velocity || 100;
                const newVelocity = Math.max(1, Math.min(127, currentVelocity + velocityChange));

                track.defaults.velocity = newVelocity;

                // Set preview for track
                previewNote = track.defaults.note;
                previewChannel = track.defaults.channel || 9;
                previewVelocity = newVelocity;

                // Update any existing explicit velocity values in the track
                this.changeVelocityInTrackExplicitValues(track, velocityChange);
                break;

            case 'steps':
                // Only preview for single step selections
                if (this.selection.stepIndices.size === 1) {
                    const stepIndex = Math.min(...this.selection.stepIndices);
                    const step = this.currentSection.tracks[this.selection.trackIndex].pattern[stepIndex];
                    const stepTrack = this.currentSection.tracks[this.selection.trackIndex];

                    if (step && step.type === 'step') {
                        const currentStepVelocity = step.velocity || stepTrack.defaults.velocity || 100;
                        const newStepVelocity = Math.max(1, Math.min(127, currentStepVelocity + velocityChange));

                        step.velocity = newStepVelocity;
                        step.fire = 1; // Activate step when changing velocity

                        const { note, channel } = this.getStepNoteAndChannel(step, stepTrack);
                        previewNote = note;
                        previewChannel = channel;
                        previewVelocity = newStepVelocity;
                    }
                } else {
                    // Apply to all selected steps without preview
                    this.selection.stepIndices.forEach(stepIndex => {
                        const step = this.currentSection.tracks[this.selection.trackIndex].pattern[stepIndex];
                        const track = this.currentSection.tracks[this.selection.trackIndex];

                        if (step && step.type === 'step') {
                            const currentStepVelocity = step.velocity || track.defaults.velocity || 100;
                            const newStepVelocity = Math.max(1, Math.min(127, currentStepVelocity + velocityChange));

                            step.velocity = newStepVelocity;
                            step.fire = 1; // Activate step when changing velocity
                        }
                    });
                }
                break;

            case 'subdivision':
                const subdivision = this.navigateToSubdivision(this.selection.trackIndex, this.selection.subdivisionPath);
                const subTrack = this.currentSection.tracks[this.selection.trackIndex];

                if (subdivision && subdivision.type === 'step') {
                    const currentSubVelocity = subdivision.velocity || subTrack.defaults.velocity || 100;
                    const newSubVelocity = Math.max(1, Math.min(127, currentSubVelocity + velocityChange));

                    subdivision.velocity = newSubVelocity;
                    subdivision.fire = 1; // Activate step when changing velocity

                    const { note, channel } = this.getStepNoteAndChannel(subdivision, subTrack);
                    previewNote = note;
                    previewChannel = channel;
                    previewVelocity = newSubVelocity;
                }
                break;

            case 'subdivision-steps':
                if (this.selection.subdivisionPath && this.selection.subdivisionPath.length >= 2) {
                    const pathWithoutSet = this.selection.subdivisionPath.slice(0, -1);
                    const selectedSubSteps = this.selection.subdivisionPath[this.selection.subdivisionPath.length - 1];
                    const subdivision = this.navigateToSubdivision(this.selection.trackIndex, pathWithoutSet);
                    const subTrack = this.currentSection.tracks[this.selection.trackIndex];

                    if (subdivision && subdivision.pattern) {
                        // Only preview for single subdivision step selections
                        if (selectedSubSteps.size === 1) {
                            const subIndex = Math.min(...selectedSubSteps);
                            const subStep = subdivision.pattern[subIndex];

                            if (subStep && subStep.type === 'step') {
                                const currentSubStepVelocity = subStep.velocity || subTrack.defaults.velocity || 100;
                                const newSubStepVelocity = Math.max(1, Math.min(127, currentSubStepVelocity + velocityChange));

                                subStep.velocity = newSubStepVelocity;
                                subStep.fire = 1; // Activate step when changing velocity

                                const { note, channel } = this.getStepNoteAndChannel(subStep, subTrack);
                                previewNote = note;
                                previewChannel = channel;
                                previewVelocity = newSubStepVelocity;
                            }
                        } else {
                            // Apply to all selected substeps without preview
                            selectedSubSteps.forEach(subIndex => {
                                const subStep = subdivision.pattern[subIndex];
                                if (subStep && subStep.type === 'step') {
                                    const currentSubStepVelocity = subStep.velocity || subTrack.defaults.velocity || 100;
                                    const newSubStepVelocity = Math.max(1, Math.min(127, currentSubStepVelocity + velocityChange));

                                    subStep.velocity = newSubStepVelocity;
                                    subStep.fire = 1; // Activate step when changing velocity
                                }
                            });
                        }
                    }
                }
                break;
        }

        // Play preview for individual changes only
        if (previewNote !== null && previewChannel !== null && previewVelocity !== null && !this.player.isPlaying) {
            this.playNotePreview(previewNote, previewChannel, previewVelocity);
        }

        this.updateContextMenuInputsFromSelection();
        this.player.updateTrackStates();
        this.render("changeVelocitySelection");
        this.updateContextMenu();

    }

    applyVelocityToSpecificStep(action, velocity, activate) {
        const step = this.getStepFromAction(action);

        if (step && step.type === 'step') {
            step.fire = activate ? 1 : 0;
            if (activate && velocity !== undefined) {
                step.velocity = velocity;
            } else if (!activate) {
                // When deactivating, only remove velocity if it was explicitly set
                // Keep fire = 0 but preserve other properties
                delete step.velocity;
            }
        }
    }


    getFirstActiveStepInPattern(pattern) {
        for (const step of pattern) {
            if (step.type === 'step' && step.fire === 1) {
                return step;
            } else if (step.subdivide && step.pattern) {
                const foundStep = this.getFirstActiveStepInPattern(step.pattern);
                if (foundStep) return foundStep;
            }
        }

        // If no active steps, return first step
        for (const step of pattern) {
            if (step.type === 'step') {
                return step;
            } else if (step.subdivide && step.pattern) {
                const foundStep = this.getFirstActiveStepInPattern(step.pattern);
                if (foundStep) return foundStep;
            }
        }

        return null;
    }
    changePitchSelectionIndividually(direction) {
        if (this.selection.type === 'none') return;

        // Store preview info for single selections only
        let previewNote = null;
        let previewChannel = null;

        switch (this.selection.type) {
            case 'track':
                const track = this.currentSection.tracks[this.selection.trackIndex];
                const currentPitch = track.defaults.pitch || 0;
                let newPitch = currentPitch + direction;

                const scale = track.defaults.scale || 4095;
                const octave = track.defaults.octave || 3;
                const scaleNotes = this.numberToScale(scale);
                let newOctave = octave;

                if (newPitch >= scaleNotes.length) {
                    newPitch = 0;
                    newOctave = Math.min(10, newOctave + 1);
                } else if (newPitch < 0) {
                    newPitch = scaleNotes.length - 1;
                    newOctave = Math.max(0, newOctave - 1);
                }

                track.defaults.pitch = newPitch;
                track.defaults.octave = newOctave;
                track.defaults.note = this.noteFromPitchOctaveScale(newPitch, newOctave, scale);

                // Set preview
                previewNote = track.defaults.note;
                previewChannel = track.defaults.channel || 9;

                this.changePitchInTrackExplicitValues(track, direction);
                break;

            case 'steps':
                // Only preview for single step selections
                if (this.selection.stepIndices.size === 1) {
                    const stepIndex = Math.min(...this.selection.stepIndices);
                    const step = this.currentSection.tracks[this.selection.trackIndex].pattern[stepIndex];
                    const stepTrack = this.currentSection.tracks[this.selection.trackIndex];

                    if (step && step.type === 'step') {
                        // Calculate new note after change
                        const tempStep = JSON.parse(JSON.stringify(step)); // Clone for preview
                        this.changePitchInStep(tempStep, stepTrack, direction);
                        const { note, channel } = this.getStepNoteAndChannel(tempStep, stepTrack);
                        previewNote = note;
                        previewChannel = channel;
                    }
                }

                // Apply to all selected steps
                this.selection.stepIndices.forEach(stepIndex => {
                    const step = this.currentSection.tracks[this.selection.trackIndex].pattern[stepIndex];
                    const track = this.currentSection.tracks[this.selection.trackIndex];

                    if (step && step.type === 'step') {
                        this.changePitchInStep(step, track, direction);
                    }
                });
                break;

            case 'subdivision':
                const subdivision = this.navigateToSubdivision(this.selection.trackIndex, this.selection.subdivisionPath);
                const subTrack = this.currentSection.tracks[this.selection.trackIndex];

                if (subdivision) {
                    if (subdivision.type === 'step') {
                        // Single subdivision step - preview
                        const tempStep = JSON.parse(JSON.stringify(subdivision));
                        this.changePitchInStep(tempStep, subTrack, direction);
                        const { note, channel } = this.getStepNoteAndChannel(tempStep, subTrack);
                        previewNote = note;
                        previewChannel = channel;

                        this.changePitchInStep(subdivision, subTrack, direction);
                    } else if (subdivision.subdivide && subdivision.pattern) {
                        // Multiple steps - no preview
                        this.changePitchInPatternRecursively(subdivision.pattern, subTrack, direction);
                    }
                }
                break;

            case 'subdivision-steps':
                if (this.selection.subdivisionPath && this.selection.subdivisionPath.length >= 2) {
                    const pathWithoutSet = this.selection.subdivisionPath.slice(0, -1);
                    const selectedSubSteps = this.selection.subdivisionPath[this.selection.subdivisionPath.length - 1];
                    const subdivision = this.navigateToSubdivision(this.selection.trackIndex, pathWithoutSet);
                    const subTrack = this.currentSection.tracks[this.selection.trackIndex];

                    if (subdivision && subdivision.pattern) {
                        // Only preview for single subdivision step selections
                        if (selectedSubSteps.size === 1) {
                            const subIndex = Math.min(...selectedSubSteps);
                            const subStep = subdivision.pattern[subIndex];

                            if (subStep && subStep.type === 'step') {
                                const tempStep = JSON.parse(JSON.stringify(subStep));
                                this.changePitchInStep(tempStep, subTrack, direction);
                                const { note, channel } = this.getStepNoteAndChannel(tempStep, subTrack);
                                previewNote = note;
                                previewChannel = channel;
                            }
                        }

                        // Apply to all selected substeps
                        selectedSubSteps.forEach(subIndex => {
                            const subStep = subdivision.pattern[subIndex];
                            if (subStep && subStep.type === 'step') {
                                this.changePitchInStep(subStep, subTrack, direction);
                            }
                        });
                    }
                }
                break;
        }

        // Play preview for individual changes only
        if (previewNote !== null && previewChannel !== null && !this.player.isPlaying) {
            this.playNotePreview(previewNote, previewChannel);
        }

        this.updateContextMenuInputsFromSelection();
        this.player.updateTrackStates();
        this.render("changePitchSelectionIndividually");
        this.updateContextMenu();

    }

    changePitchInTrackExplicitValues(track, direction) {
        this.changePitchInPatternExplicitValues(track.pattern, track, direction);
    }

    changePitchInPatternExplicitValues(pattern, track, direction) {
        pattern.forEach(step => {
            if (step.type === 'step') {
                // Only change if the step has explicit pitch values
                if (step.pitch !== undefined || step.note !== undefined || step.octave !== undefined) {
                    this.changePitchInStep(step, track, direction);
                }
                // If no explicit values, leave it alone (will use defaults)
            } else if (step.subdivide && step.pattern) {
                // Recursively process subdivisions
                this.changePitchInPatternExplicitValues(step.pattern, track, direction);
            }
        });
    }

    // Helper method to change pitch in a single step
    changePitchInStep(step, track, direction) {
        const currentPitch = step.pitch || 0;
        const currentOctave = step.octave || track.defaults.octave || 3;
        const currentScale = step.scale || track.defaults.scale || 4095;

        let newPitch = currentPitch + direction;
        let newOctave = currentOctave;

        // Handle scale wrapping
        const scaleNotes = this.numberToScale(currentScale);

        if (newPitch >= scaleNotes.length) {
            newPitch = 0;
            newOctave = Math.min(10, newOctave + 1);
        } else if (newPitch < 0) {
            newPitch = scaleNotes.length - 1;
            newOctave = Math.max(0, newOctave - 1);
        }

        step.pitch = newPitch;
        step.octave = newOctave;
        step.note = this.noteFromPitchOctaveScale(newPitch, newOctave, currentScale);
        step.fire = 1; // Activate step when changing pitch
    }

    // Helper method to change pitch in all steps of a track recursively
    changePitchInTrackRecursively(trackIndex, direction) {
        const track = this.currentSection.tracks[trackIndex];
        this.changePitchInPatternRecursively(track.pattern, track, direction);
    }

    // Helper method to change pitch in a pattern recursively
    changePitchInPatternRecursively(pattern, track, direction) {
        pattern.forEach(step => {
            if (step.type === 'step') {
                this.changePitchInStep(step, track, direction);
            } else if (step.subdivide && step.pattern) {
                // Recursively process subdivisions
                this.changePitchInPatternRecursively(step.pattern, track, direction);
            }
        });
    }

    changePitchSelection(direction) {
        // This method is now just an alias for the individual change method
        this.changePitchSelectionIndividually(direction);
    }

    parseNumberAndTE(thing) {
        if (thing === 't' || thing === 'T') return 10;
        if (thing === 'e' || thing === 'E') return 11;
        return parseInt(thing);
    }

    handleShiftClick(action) {
        if (action.subdivisionPath && action.subdivisionPath.length > 0) {
            // Always use the existing subdivision selection logic
            this.handleSelectionClick(action);
        } else {
            // Regular step selection
            this.handleRegularStepSelection(action.track, action.step);
        }
        this.selectionChanged = true;
    }

    handleSelectionClick(action) {
        if (action.subdivisionPath && action.subdivisionPath.length > 0) {
            const requiredParentPath = this.getRequiredParentPath(action.track, action.step, action.subdivisionPath);

            if (this.isWithinSameSubdivisionContext(action.track, action.step, action.subdivisionPath)) {
                this.handleSubdivisionStepSelection(action.track, action.step, action.subdivisionPath);
            } else if (this.isExactPathSelected(requiredParentPath)) {
                this.selectNextLevel(action.track, action.step, action.subdivisionPath);
            } else {
                this.clearSelection();
                this.selection = {
                    type: 'subdivision',
                    trackIndex: action.track,
                    stepIndices: new Set([action.step]),
                    subdivisionPath: requiredParentPath
                };
            }
        } else {
            this.handleRegularStepSelection(action.track, action.step);
        }
    }

    getRequiredParentPath(track, step, subdivisionPath) {
        const fullPath = [step, ...subdivisionPath];
        if (fullPath.length === 1) {
            return fullPath;
        } else {
            return fullPath.slice(0, -1);
        }
    }

    // Helper methods for tab detection
    isCurrentTabRhythm() {
        const activeTab = document.querySelector('.context-tab.active');
        return activeTab && activeTab.getAttribute('data-tab') === 'rhythm';
    }

    isCurrentTabMelody() {
        const activeTab = document.querySelector('.context-tab.active');
        return activeTab && activeTab.getAttribute('data-tab') === 'melody';
    }

    isCurrentTabSection() {
        const activeTab = document.querySelector('.context-tab.active');
        return activeTab && activeTab.getAttribute('data-tab') === 'section';
    }

    isNumberKey(key) {
        return /^[0-9teTE]$/.test(key);
    }

    // Quick subdivision creation
    createQuickSubdivision(subdivisionCount) {
        if (this.selection.type === 'none') return;

        if (this.selection.type === 'steps' && this.selection.stepIndices.size > 0) {
            this.createRegularSubdivisionQuick(subdivisionCount);
        } else if ((this.selection.type === 'subdivision-steps' || this.selection.type === 'subdivision') && this.selection.subdivisionPath) {
            this.createNestedSubdivisionQuick(subdivisionCount);
        }

        this.clearSelection();
        this.player.updateTrackStates();
        this.render("createQuickSubdivision");
        this.updateContextMenu();
    }

    createRegularSubdivisionQuick(subdivisionCount) {
        const stepIndices = Array.from(this.selection.stepIndices).sort((a, b) => a - b);
        const track = this.currentSection.tracks[this.selection.trackIndex];

        const subdivision = {
            subdivide: subdivisionCount,
            span: stepIndices.length,
            pattern: Array.from({ length: subdivisionCount }, () => ({ type: "step", fire: 0 }))
        };

        track.pattern[stepIndices[0]] = subdivision;

        // Remove other selected steps (in reverse order)
        for (let i = stepIndices.length - 1; i >= 1; i--) {
            track.pattern.splice(stepIndices[i], 1);
        }
    }

    createNestedSubdivisionQuick(subdivisionCount) {
        if (this.selection.type === 'subdivision-steps') {
            const pathWithoutSet = this.selection.subdivisionPath.slice(0, -1);
            const selectedSubSteps = this.selection.subdivisionPath[this.selection.subdivisionPath.length - 1];

            const subdivision = this.navigateToSubdivision(this.selection.trackIndex, pathWithoutSet);
            if (!subdivision || !subdivision.pattern) return;

            const selectedIndices = Array.from(selectedSubSteps).sort((a, b) => a - b);

            const nestedSubdivision = {
                subdivide: subdivisionCount,
                span: selectedIndices.length,
                pattern: Array.from({ length: subdivisionCount }, () => ({ type: "step", fire: 0 }))
            };

            subdivision.pattern[selectedIndices[0]] = nestedSubdivision;

            for (let i = selectedIndices.length - 1; i >= 1; i--) {
                subdivision.pattern.splice(selectedIndices[i], 1);
            }
        } else if (this.selection.type === 'subdivision') {
            const subdivision = this.navigateToSubdivision(this.selection.trackIndex, this.selection.subdivisionPath);
            if (!subdivision || !subdivision.pattern) return;

            const nestedSubdivision = {
                subdivide: subdivisionCount,
                span: subdivision.pattern.length,
                pattern: Array.from({ length: subdivisionCount }, () => ({ type: "step", fire: 0 }))
            };

            subdivision.pattern = [nestedSubdivision];
            subdivision.subdivide = 1;
        }
    }

    setPitchNumber(pitch) {
        if (this.selection.type === 'none') return;

        const currentOctave = parseInt($('octave-input').value) || 3;
        const currentScale = parseInt($('scale-input').value) || 4095;

        const note = this.noteFromPitchOctaveScale(pitch, currentOctave, currentScale);

        // Update the input fields
        $('pitch-input').value = pitch;
        $('note-input').value = note;

        if (this.selection.type === 'track') {
            // For track selection, set defaults AND update any existing explicit values
            const track = this.currentSection.tracks[this.selection.trackIndex];

            // 1. Set track defaults
            track.defaults.pitch = pitch;
            track.defaults.octave = currentOctave;
            track.defaults.note = note;

            // 2. Set any existing explicit values to the same pitch
            this.setPitchInTrackExplicitValues(track, pitch, currentOctave, note);
        } else {
            // For all other selections, apply to the selected steps
            this.applyPitchToAllSelected(pitch, currentOctave, note, true);
        }

        // Update the visual display
        this.player.updateTrackStates();
        this.render("setPitchNumber");
        this.updateContextMenu();

    }

    setPitchInTrackExplicitValues(track, pitch, octave, note) {
        this.setPitchInPatternExplicitValues(track.pattern, pitch, octave, note);
    }

    // New method to set pitch for explicit values in pattern recursively
    setPitchInPatternExplicitValues(pattern, pitch, octave, note) {
        pattern.forEach(step => {
            if (step.type === 'step') {
                // Only set if the step has explicit values
                if (step.pitch !== undefined || step.note !== undefined || step.octave !== undefined) {
                    step.pitch = pitch;
                    step.octave = octave;
                    step.note = note;
                    step.fire = 1; // Activate when setting pitch
                }
                // If no explicit values, leave it alone (will use defaults)
            } else if (step.subdivide && step.pattern) {
                // Recursively process subdivisions
                this.setPitchInPatternExplicitValues(step.pattern, pitch, octave, note);
            }
        });
    }

    playNotePreview(note, channel, velocity = 100, duration = 150) {

        // Only play if player exists, has MIDI output, and is NOT playing
        if (!this.player || this.player.isPlaying) {
            return;
        }

        this.player.playPreviewNote(note, channel - 1, velocity);
    }

    getStepNoteAndChannel(step, track) {
        let note, channel;

        // Get note
        if (step.note !== undefined) {
            note = step.note;
        } else if (step.pitch !== undefined) {
            const octave = step.octave || track.defaults.octave || 3;
            const scale = step.scale || track.defaults.scale || 4095;
            note = this.noteFromPitchOctaveScale(step.pitch, octave, scale);
        } else {
            // Use track defaults
            if (track.defaults.note !== undefined) {
                note = track.defaults.note;
            } else if (track.defaults.pitch !== undefined) {
                const octave = track.defaults.octave || 3;
                const scale = track.defaults.scale || 4095;
                note = this.noteFromPitchOctaveScale(track.defaults.pitch, octave, scale);
            } else {
                note = 36; // Fallback
            }
        }

        // Get channel
        channel = step.channel || track.defaults.channel || 9;

        return { note, channel };
    }



    changePitchSelection(direction) {
        if (this.selection.type === 'none') return;

        const currentPitch = parseInt($('pitch-input').value) || 0;
        const currentOctave = parseInt($('octave-input').value) || 3;
        const currentScale = parseInt($('scale-input').value) || 4095;

        let newPitch = currentPitch + direction;
        let newOctave = currentOctave;

        const scaleNotes = this.numberToScale(currentScale);

        if (newPitch >= scaleNotes.length) {
            newPitch = 0;
            newOctave = Math.min(10, newOctave + 1);
        } else if (newPitch < 0) {
            newPitch = scaleNotes.length - 1;
            newOctave = Math.max(0, newOctave - 1);
        }

        const note = this.noteFromPitchOctaveScale(newPitch, newOctave, currentScale);

        $('pitch-input').value = newPitch;
        $('octave-input').value = newOctave;
        $('note-input').value = note;

        this.applyNote();
        this.updateContextMenu();
    }

    // Updated pitch/scale methods (simplified)
    noteFromPitchOctaveScale(pitch, octave, scale = 4095) {
        const scaleNotes = this.numberToScale(scale);
        const pitchInScale = scaleNotes[pitch % scaleNotes.length];
        return (octave * 12) + pitchInScale;
    }

    updatePitchOctaveFromNote(note, scale = 4095) {
        const pitchInput = $('pitch-input');
        const octaveInput = $('octave-input');
        const scaleInput = $('scale-input');

        const octave = this.octaveFromNote(note);
        const pitch = this.pitchFromNoteAndScale(note, octave, scale);

        pitchInput.value = pitch;
        octaveInput.value = octave;
        scaleInput.value = scale;
    }


    isExactPathSelected(path) {
        if (!Array.isArray(path) || !this.selection.subdivisionPath) {
            return false;
        }

        return this.selection.type === 'subdivision' &&
            this.selection.subdivisionPath &&
            this.arraysEqual(this.selection.subdivisionPath, path);
    }

    arraysEqual(a, b) {
        if (!Array.isArray(a) || !Array.isArray(b)) return false;
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    selectNextLevel(track, step, subdivisionPath) {
        this.clearSelection();
        this.selection = {
            type: 'subdivision',
            trackIndex: track,
            stepIndices: new Set([step]),
            subdivisionPath: [step, ...subdivisionPath]
        };
    }

    isWithinSameSubdivisionContext(track, step, subdivisionPath) {
        if (this.selection.type !== 'subdivision' && this.selection.type !== 'subdivision-steps') {
            return false;
        }

        if (this.selection.trackIndex !== track) {
            return false;
        }

        if (!this.selection.subdivisionPath) {
            return false;
        }

        const currentSelectionPath = this.selection.subdivisionPath;
        const targetPath = [step, ...subdivisionPath];

        if (this.selection.type === 'subdivision') {
            const targetParentPath = targetPath.slice(0, -1);
            return this.arraysEqual(currentSelectionPath, targetParentPath);
        }

        if (this.selection.type === 'subdivision-steps') {
            const currentParentPath = currentSelectionPath.slice(0, -1);
            const targetParentPath = targetPath.slice(0, -1);
            return this.arraysEqual(currentParentPath, targetParentPath);
        }

        return false;
    }

    handleSubdivisionStepSelection(track, step, subdivisionPath) {
        const fullPath = [step, ...subdivisionPath];
        const parentPath = fullPath.slice(0, -1);
        const targetIndex = fullPath[fullPath.length - 1];

        if (this.selection.type === 'subdivision' && this.arraysEqual(this.selection.subdivisionPath, parentPath)) {
            this.selection = {
                type: 'subdivision-steps',
                trackIndex: track,
                stepIndices: new Set([step]),
                subdivisionPath: [...parentPath, new Set([targetIndex])]
            };
        } else if (this.selection.type === 'subdivision-steps' &&
            this.arraysEqual(this.selection.subdivisionPath.slice(0, -1), parentPath)) {
            const selectedSubSteps = this.selection.subdivisionPath[this.selection.subdivisionPath.length - 1];

            if (selectedSubSteps.has(targetIndex)) {
                selectedSubSteps.delete(targetIndex);
                if (selectedSubSteps.size === 0) {
                    this.selection = {
                        type: 'subdivision',
                        trackIndex: track,
                        stepIndices: new Set([step]),
                        subdivisionPath: parentPath
                    };
                }
            } else {
                selectedSubSteps.add(targetIndex);
            }
        }
    }

    handleRegularStepSelection(track, step) {
        // Check if the step is a subdivision - if so, don't allow regular step selection
        const currentStep = this.currentSection.tracks[track].pattern[step];
        if (currentStep && currentStep.subdivide) {
            // This is a subdivision, not a regular step - ignore selection
            return;
        }

        if (this.selection.type === 'steps' && this.selection.trackIndex === track) {
            const currentSteps = Array.from(this.selection.stepIndices).sort((a, b) => a - b);

            if (this.selection.stepIndices.has(step)) {
                // Clicking on already selected step - remove it if it's at the edge
                if (step === currentSteps[0] || step === currentSteps[currentSteps.length - 1]) {
                    this.selection.stepIndices.delete(step);
                    if (this.selection.stepIndices.size === 0) {
                        this.clearSelection();
                    }
                }
                // If clicking middle step, do nothing (keep selection)
            } else {
                // Check if step is adjacent to current selection
                const minStep = currentSteps[0];
                const maxStep = currentSteps[currentSteps.length - 1];

                // Check if we can extend selection without hitting subdivisions
                if (step === minStep - 1) {
                    // Adjacent to the left - extend selection if no subdivisions in between
                    if (this.canExtendSelection(track, step, minStep)) {
                        this.selection.stepIndices.add(step);
                    }
                } else if (step === maxStep + 1) {
                    // Adjacent to the right - extend selection if no subdivisions in between
                    if (this.canExtendSelection(track, maxStep, step)) {
                        this.selection.stepIndices.add(step);
                    }
                } else {
                    // Not adjacent - select range from current selection to new step if possible
                    const newMin = Math.min(minStep, step);
                    const newMax = Math.max(maxStep, step);

                    if (this.canSelectRange(track, newMin, newMax)) {
                        this.selection.stepIndices.clear();
                        for (let i = newMin; i <= newMax; i++) {
                            this.selection.stepIndices.add(i);
                        }
                    }
                }
            }
        } else {
            // First selection or different track
            this.clearSelection();
            this.selection = {
                type: 'steps',
                trackIndex: track,
                stepIndices: new Set([step]),
                subdivisionPath: null
            };
        }
    }

    canExtendSelection(track, startStep, endStep) {
        const pattern = this.currentSection.tracks[track].pattern;
        const min = Math.min(startStep, endStep);
        const max = Math.max(startStep, endStep);

        for (let i = min; i <= max; i++) {
            if (i >= 0 && i < pattern.length) {
                const step = pattern[i];
                if (step && step.subdivide) {
                    return false; // Found a subdivision in the range
                }
            }
        }
        return true;
    }

    canSelectRange(track, startStep, endStep) {
        const pattern = this.currentSection.tracks[track].pattern;

        for (let i = startStep; i <= endStep; i++) {
            if (i >= 0 && i < pattern.length) {
                const step = pattern[i];
                if (step && step.subdivide) {
                    return false; // Found a subdivision in the range
                }
            }
        }
        return true;
    }

    shouldClearSelection(action) {
        // This method is no longer used since we always clear and select the clicked step
        // Keeping it for compatibility with shift-click behavior
        if (this.selection.type === 'none') return false;
        if (this.selection.trackIndex !== action.track) return true;
        if (this.selection.type === 'track') return true;

        if (this.selection.type === 'subdivision' || this.selection.type === 'subdivision-steps') {
            if (!action.subdivisionPath || action.subdivisionPath.length === 0) return true;
            if (this.selection.subdivisionPath && this.selection.subdivisionPath[0] !== action.step) {
                return true;
            }
            return false;
        }

        if (this.selection.type === 'steps' && action.subdivisionPath && action.subdivisionPath.length > 0) {
            return true;
        }

        return false;
    }
    handleRightClick(e) {
        e.preventDefault();
        const target = e.target;
        const action = this.parseAction(target);

        if (!action) {
            this.clearSelection();
            this.render("handleRightClick: select");
            this.updateContextMenu();
            return;
        }

        // Check if we're right-clicking on the current selection
        if (this.isClickingOnCurrentSelection(action)) {
            // Right-clicking on current selection - clear it
            this.clearSelection();
            this.render("handleRightClick: clear");
            this.updateContextMenu();
            return;
        }

        // Right-clicking on something else - select it
        this.clearSelection();

        if (action.type === 'step') {
            // Select only the single right-clicked step/subdivision
            if (action.subdivisionPath && action.subdivisionPath.length > 0) {
                // For subdivisions, select the specific subdivision element
                const fullPath = [action.step, ...action.subdivisionPath];
                this.selection = {
                    type: 'subdivision',
                    trackIndex: action.track,
                    stepIndices: new Set([action.step]),
                    subdivisionPath: fullPath
                };
            } else {
                // For regular steps, select the single step
                this.selection = {
                    type: 'steps',
                    trackIndex: action.track,
                    stepIndices: new Set([action.step]),
                    subdivisionPath: null
                };
            }
        } else if (action.type === 'header') {
            this.selectTrack(action.track);
        }

        this.render("handleRightClick: action");
        this.updateContextMenu();
    }

    isClickingOnCurrentSelection(action) {
        if (this.selection.type === 'none') return false;
        if (this.selection.trackIndex !== action.track) return false;

        switch (this.selection.type) {
            case 'track':
                return action.type === 'header';

            case 'steps':
                if (action.type !== 'step') return false;
                if (action.subdivisionPath && action.subdivisionPath.length > 0) return false;
                return this.selection.stepIndices.has(action.step);

            case 'subdivision':
                if (action.type !== 'step') return false;
                if (!action.subdivisionPath || action.subdivisionPath.length === 0) return false;
                const targetPath = [action.step, ...action.subdivisionPath];
                return this.arraysEqual(this.selection.subdivisionPath, targetPath);

            case 'subdivision-steps':
                if (action.type !== 'step') return false;
                if (!action.subdivisionPath || action.subdivisionPath.length === 0) return false;

                const parentPath = this.selection.subdivisionPath.slice(0, -1);
                const selectedSubSteps = this.selection.subdivisionPath[this.selection.subdivisionPath.length - 1];
                const targetParentPath = [action.step, ...action.subdivisionPath.slice(0, -1)];
                const targetSubStep = action.subdivisionPath[action.subdivisionPath.length - 1];

                return this.arraysEqual(parentPath, targetParentPath) &&
                    selectedSubSteps.has(targetSubStep);
        }

        return false;
    }

    euclideanCycle(pulses, length) {
        if (pulses == length) return Array.from({ length }, () => true);

        function startsDescent(list, i) {
            const length = list.length;
            const nextIndex = (i + 1) % length;
            return list[i] > list[nextIndex] ? true : false;
        }

        if (pulses >= length) return [true];

        const resList = Array.from(
            { length },
            (_, i) => (((pulses * (i - 1)) % length) + length) % length,
        );

        let cycle = resList.map((_, i) => startsDescent(resList, i));
        return cycle;
    }

    generateEuclideanPattern(trackIndex, steps, pulses) {
        const track = this.currentSection.tracks[trackIndex];
        const wasTrackSelected = this.selection.type === 'track' && this.selection.trackIndex === trackIndex;

        // Extract active steps and span=1 subdivisions from current pattern
        const activePulses = this.extractActivePulses(track.pattern);

        // Generate new euclidean pattern
        const euclideanPattern = this.euclideanCycle(pulses, steps);

        // Create new pattern with default steps
        const newPattern = euclideanPattern.map((fire, index) => ({
            type: "step",
            fire: fire ? 1 : 0
        }));

        // Find active positions in new euclidean pattern
        const activeIndices = [];
        newPattern.forEach((step, index) => {
            if (step.fire === 1) {
                activeIndices.push(index);
            }
        });

        // Map preserved pulses to new active positions
        activePulses.forEach((pulse, index) => {
            if (index < activeIndices.length) {
                const targetIndex = activeIndices[index];
                newPattern[targetIndex] = { ...pulse };
            }
        });

        // Update track
        track.pattern = newPattern;

        // Update operations
        if (!track.operations) track.operations = {};
        if (!track.operations.euclidean) track.operations.euclidean = {};
        track.operations.euclidean.pulses = pulses;

        // Handle selection
        if (this.selection.trackIndex === trackIndex && this.selection.type !== 'track') {
            this.clearSelection();
        }
        if (wasTrackSelected) {
            this.selectTrack(trackIndex);
        }

        this.player.updateTrackStates();
        this.render("generateEuclideanPattern");
        this.updateContextMenu();
    }

    // Extract active steps and span=1 subdivisions from pattern
    extractActivePulses(pattern) {
        const activePulses = [];

        pattern.forEach(step => {
            if (step.type === 'step' && step.fire === 1) {
                // Active regular step
                activePulses.push({ ...step });
            } else if (step.subdivide && step.pattern) {
                const span = step.span || 1;
                if (span === 1 && this.hasActiveSteps(step.pattern)) {
                    // Span=1 subdivision with active steps
                    activePulses.push({ ...step });
                }
            }
        });

        return activePulses;
    }

    hasActiveSteps(pattern) {
        return pattern.some(step => {
            if (step.type === 'step' && step.fire === 1) {
                return true;
            } else if (step.subdivide && step.pattern) {
                return this.hasActiveSteps(step.pattern);
            }
            return false;
        });
    }

    // Simple track length adjustment (no preservation)
    adjustTrackLength(trackIndex, newLength) {
        const track = this.currentSection.tracks[trackIndex];
        const currentLength = track.pattern.length;

        if (newLength > currentLength) {
            for (let i = currentLength; i < newLength; i++) {
                track.pattern.push({ type: "step", fire: 0 });
            }
        } else if (newLength < currentLength) {
            track.pattern.splice(newLength);
        }
    }

    // Length change handler (no preservation, just adjust)
    handleLengthChange(trackIndex, newLength) {
        const track = this.currentSection.tracks[trackIndex];

        this.adjustTrackLength(trackIndex, newLength);

        // Limit pulses if needed
        if (track.operations?.euclidean?.pulses !== undefined) {
            const currentPulses = track.operations.euclidean.pulses;
            if (currentPulses > newLength) {
                track.operations.euclidean.pulses = newLength;
            }
        }

        if (this.selection.type !== 'track' || this.selection.trackIndex !== trackIndex) {
            this.clearSelection();
            this.selectTrack(trackIndex);
        }

        this.player.updateTrackStates();
        this.render("handleLengthChange");
        this.updateContextMenu();
    }

    // Pulse change handler (with preservation)
    handlePulsesChange(trackIndex, newPulses) {
        const track = this.currentSection.tracks[trackIndex];
        const currentLength = track.pattern.length;

        if (this.selection.type !== 'track' || this.selection.trackIndex !== trackIndex) {
            this.clearSelection();
            this.selectTrack(trackIndex);
        }

        this.generateEuclideanPattern(trackIndex, currentLength, newPulses);
    }

    handleTrackControlFocus(e) {
        // Select track when length, pulses, rotate are focused
        if (e.target.classList.contains('track-length-input') ||
            e.target.classList.contains('track-euclidean-pulses-input') ||
            e.target.classList.contains('track-rotate-input')) {

            const trackIndex = parseInt(e.target.dataset.track);

            // Only change selection if not already selected
            if (this.selection.type !== 'track' || this.selection.trackIndex !== trackIndex) {
                this.clearSelection();
                this.selectTrack(trackIndex);
                this.render("handleTrackControlFocus: clear selection");
                this.updateContextMenu();
            }
        }

        // Add blur handler for the focused input
        if (e.target.classList.contains('track-length-input') ||
            e.target.classList.contains('track-euclidean-pulses-input') ||
            e.target.classList.contains('track-rotate-input')) {

            const handleBlur = (blurEvent) => {
                if (blurEvent.target.classList.contains('track-length-input')) {
                    const trackIndex = parseInt(blurEvent.target.dataset.track);
                    const newLength = parseInt(blurEvent.target.value) || 1;
                    const clampedLength = Math.max(1, Math.min(32, newLength));

                    if (clampedLength !== newLength) {
                        blurEvent.target.value = clampedLength;
                    }

                    this.adjustTrackLength(trackIndex, clampedLength);
                    this.handleLengthChange(trackIndex, clampedLength);
                } else if (blurEvent.target.classList.contains('track-euclidean-pulses-input')) {
                    const trackIndex = parseInt(blurEvent.target.dataset.track);
                    const pulses = parseInt(blurEvent.target.value) || 0;
                    const track = this.currentSection.tracks[trackIndex];
                    const steps = track.pattern.length;
                    const limitedPulses = Math.max(0, Math.min(pulses, steps));

                    if (limitedPulses !== pulses) {
                        blurEvent.target.value = limitedPulses;
                    }

                    if (this.selection.type !== 'track' || this.selection.trackIndex !== trackIndex) {
                        this.clearSelection();
                        this.selectTrack(trackIndex);
                    }

                    this.generateEuclideanPattern(trackIndex, steps, limitedPulses);
                } else if (blurEvent.target.classList.contains('track-rotate-input')) {
                    const trackIndex = parseInt(blurEvent.target.dataset.track);
                    const rotateValue = parseInt(blurEvent.target.value) || 1;
                    const clampedRotateValue = Math.max(1, Math.min(32, rotateValue));

                    if (clampedRotateValue !== rotateValue) {
                        blurEvent.target.value = clampedRotateValue;
                    }

                    const track = this.currentSection.tracks[trackIndex];
                    if (!track.defaults) track.defaults = {};
                    track.defaults.rotate = clampedRotateValue;
                }

                // Remove the blur listener after use
                blurEvent.target.removeEventListener('blur', handleBlur);
            };

            e.target.addEventListener('blur', handleBlur);
        }
    }

    addNewTrack() {
        const newTrack = {
            name: `Track ${this.currentSection.tracks.length + 1}`,
            defaults: {
                note: 36,
                channel: 9,
                velocity: 100  // Add velocity default
            },
            playback: { muted: false },
            pattern: [
                { type: "step", fire: 0 },
                { type: "step", fire: 0 },
                { type: "step", fire: 0 },
                { type: "step", fire: 0 }
            ],
            operations: { euclidean: { steps: 4, pulses: 1 }, rotate: 0 },
            layout: { minimized: false }
        };

        this.currentSection.tracks.push(newTrack);
        this.player.updateTrackStates();
        this.render("addNewTrack");
    }
    handleTrackControlInput(e) {
        const trackIndex = parseInt(e.target.dataset.track);

        if (e.target.classList.contains('track-name-input') ||
            e.target.classList.contains('track-name-input-small')) {
            this.currentSection.tracks[trackIndex].name = e.target.value;
            if (this.selection.type === 'track' && this.selection.trackIndex === trackIndex) {
                this.updateSectionDisplay();
            }
        } else if (e.target.classList.contains('track-length-input')) {
            // Will be processed on blur or enter
            return;
        } else if (e.target.classList.contains('track-euclidean-pulses-input')) {
            // Will be processed on blur or enter
            return;
        } else if (e.target.classList.contains('track-rotate-input')) {
            const rotateValue = parseInt(e.target.value) || 1;
            const track = this.currentSection.tracks[trackIndex];
            if (!track.defaults) track.defaults = {};
            track.defaults.rotate = Math.max(1, Math.min(32, rotateValue));
            return;
        }
    }

    handleTrackControlChange(e) {
        if (e.target.classList.contains('track-mute-checkbox')) {
            const trackIndex = parseInt(e.target.dataset.track);
            if (!this.currentSection.tracks[trackIndex].playback) {
                this.currentSection.tracks[trackIndex].playback = {};
            }
            this.currentSection.tracks[trackIndex].playback.muted = e.target.checked;
        }
    }

    attachTrackControlButtonListeners() {
        // Length decrease buttons
        document.querySelectorAll('.track-length-decrease').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const trackIndex = parseInt(e.target.dataset.track);
                const currentLength = this.currentSection.tracks[trackIndex].pattern.length;
                if (currentLength > 1) {
                    this.adjustTrackLength(trackIndex, currentLength - 1);
                    this.handleLengthChange(trackIndex, currentLength - 1);
                }
            });
        });

        // Length increase buttons
        document.querySelectorAll('.track-length-increase').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const trackIndex = parseInt(e.target.dataset.track);
                const currentLength = this.currentSection.tracks[trackIndex].pattern.length;
                if (currentLength < 32) {
                    this.adjustTrackLength(trackIndex, currentLength + 1);
                    this.handleLengthChange(trackIndex, currentLength + 1);
                }
            });
        });

        // Pulses decrease buttons
        document.querySelectorAll('.track-pulses-decrease').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const trackIndex = parseInt(e.target.dataset.track);
                const track = this.currentSection.tracks[trackIndex];
                const currentPulses = track.operations?.euclidean?.pulses || 0;
                if (currentPulses > 0) {
                    this.handlePulsesChange(trackIndex, currentPulses - 1);
                }
            });
        });

        // Pulses increase buttons
        document.querySelectorAll('.track-pulses-increase').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const trackIndex = parseInt(e.target.dataset.track);
                const track = this.currentSection.tracks[trackIndex];
                const currentPulses = track.operations?.euclidean?.pulses || 0;
                const maxPulses = track.pattern.length;
                if (currentPulses < maxPulses) {
                    this.handlePulsesChange(trackIndex, currentPulses + 1);
                }
            });
        });
    }
    handleTrackControlClick(e) {
        // Handle shadow track click
        if (e.target.closest('#shadow-track')) {
            e.stopPropagation();
            this.addNewTrack();
            return;
        }

        if (e.target.classList.contains('remove-button')) {
            e.stopPropagation();
            const trackIndex = parseInt(e.target.id.split('-')[1]);
            this.confirmRemoveTrack(trackIndex);
        } else if (e.target.classList.contains('track-length-decrease')) {
            e.stopPropagation();
            const trackIndex = parseInt(e.target.dataset.track);
            const currentLength = this.currentSection.tracks[trackIndex].pattern.length;
            if (currentLength > 1) {
                this.adjustTrackLength(trackIndex, currentLength - 1);
                this.handleLengthChange(trackIndex, currentLength - 1);
            }
        } else if (e.target.classList.contains('track-length-increase')) {
            e.stopPropagation();
            const trackIndex = parseInt(e.target.dataset.track);
            const currentLength = this.currentSection.tracks[trackIndex].pattern.length;
            if (currentLength < 32) {
                this.adjustTrackLength(trackIndex, currentLength + 1);
                this.handleLengthChange(trackIndex, currentLength + 1);
            }
        } else if (e.target.classList.contains('track-pulses-decrease')) {
            e.stopPropagation();
            const trackIndex = parseInt(e.target.dataset.track);
            const track = this.currentSection.tracks[trackIndex];
            const currentPulses = track.operations?.euclidean?.pulses || 0;
            if (currentPulses > 0) {
                this.handlePulsesChange(trackIndex, currentPulses - 1);
            }
        } else if (e.target.classList.contains('track-pulses-increase')) {
            e.stopPropagation();
            const trackIndex = parseInt(e.target.dataset.track);
            const track = this.currentSection.tracks[trackIndex];
            const currentPulses = track.operations?.euclidean?.pulses || 0;
            const maxPulses = track.pattern.length;
            if (currentPulses < maxPulses) {
                this.handlePulsesChange(trackIndex, currentPulses + 1);
            }
        } else if (e.target.classList.contains('track-rotate-decrease')) {
            e.stopPropagation();
            const trackIndex = parseInt(e.target.dataset.track);
            this.handleTrackNRotate(trackIndex, -1);
        } else if (e.target.classList.contains('track-rotate-increase')) {
            e.stopPropagation();
            const trackIndex = parseInt(e.target.dataset.track);
            this.handleTrackNRotate(trackIndex, 1);
        }
    }

    // Method to handle n-step track rotation
    handleTrackNRotate(trackIndex, direction) {
        const track = this.currentSection.tracks[trackIndex];
        const rotateAmount = track.defaults.rotate || 1;

        // Always select the track first
        this.clearSelection();
        this.selectTrack(trackIndex);

        // Re-render to show track selection
        this.render("handleTrackNRotate: select track");
        this.updateContextMenu();

        // Apply n-step rotation using refactored applyRotate method
        this.applyRotate(direction, rotateAmount);
    }

    confirmRemoveTrack(trackIndex) {
        const track = this.currentSection.tracks[trackIndex];
        this.pendingRemoveTrackIndex = trackIndex;

        $('confirm-title').textContent = 'Remove Track';
        $('confirm-message').textContent = `Are you sure you want to remove "${track.name}"? This cannot be undone.`;
        $('confirm-dialog').classList.add('show');
    }

    handleConfirmYes() {
        if (this.pendingRemoveTrackIndex !== undefined) {
            this.removeTrack(this.pendingRemoveTrackIndex);
            this.pendingRemoveTrackIndex = undefined;
        } else if (this.pendingRemoveSectionIndex !== undefined) {
            this.removeSection(this.pendingRemoveSectionIndex);
            this.pendingRemoveSectionIndex = undefined;
        } else if (this.pendingClearAction === 'section') {
            this.clearCurrentSection();
            this.pendingClearAction = undefined;
        } else if (this.pendingClearAction === 'all') {
            this.clearAllSections();
            this.pendingClearAction = undefined;
        }
        this.hideConfirmDialog();
    }

    hideConfirmDialog() {
        $('confirm-dialog').classList.remove('show');
        this.pendingRemoveTrackIndex = undefined;
        this.pendingRemoveSectionIndex = undefined;
        this.pendingClearAction = undefined;
    }

    removeTrack(trackIndex) {
        if (this.selection.trackIndex === trackIndex) {
            this.clearSelection();
        } else if (this.selection.trackIndex > trackIndex) {
            this.selection.trackIndex--;
        }

        this.currentSection.tracks.splice(trackIndex, 1);
        this.render("removeTrack");
        this.updateContextMenu();
    }

    adjustTrackLength(trackIndex, newLength) {
        const track = this.currentSection.tracks[trackIndex];
        const currentLength = track.pattern.length;

        if (newLength > currentLength) {
            // Extending track - add new default steps
            for (let i = currentLength; i < newLength; i++) {
                track.pattern.push({ type: "step", fire: 0 });
            }
        } else if (newLength < currentLength) {
            // Shortening track - remove steps from end
            track.pattern.splice(newLength);
        }
    }

    cloneTrack(trackIndex) {
        const originalTrack = this.currentSection.tracks[trackIndex];
        const clonedTrack = JSON.parse(JSON.stringify(originalTrack));

        const baseName = originalTrack.name.replace(/ \(\d+\)$/, '');
        let newIndex = 2;
        let newName = baseName + ' (' + newIndex + ')';

        while (this.currentSection.tracks.some(track => track.name === newName)) {
            newIndex++;
            newName = baseName + ' (' + newIndex + ')';
        }

        clonedTrack.name = newName;

        if (clonedTrack.layout) {
            clonedTrack.layout.selected = false;
            clonedTrack.layout.minimized = false;
        }

        this.currentSection.tracks.push(clonedTrack);
    }

    parseAction(element) {
        if (!element || element.closest('#context-menu') || element.closest('#menu') ||
            element.closest('#midi-modal') || element.closest('#json-modal')) {
            return null;
        }

        if (!element.closest('#sequencer')) {
            return null;
        }

        let current = element;
        while (current && current !== document.body) {
            const id = current.id;

            if (current.classList.contains('track-header')) {
                const headerMatch = id.match(/header-(\d+)/) ||
                    current.querySelector('[id*="header-"]')?.id.match(/header-(\d+)/) ||
                    current.querySelector('[id*="-"]')?.id.match(/-(\d+)/);
                if (headerMatch) {
                    return { type: 'header', track: parseInt(headerMatch[1]) };
                }
            }

            if (id) {
                if (id.startsWith('step-')) {
                    const parts = id.split('-');
                    return {
                        type: 'step',
                        track: parseInt(parts[1]),
                        step: parseInt(parts[2]),
                        subdivisionPath: parts.slice(3).filter(p => p !== undefined).map(p => parseInt(p))
                    };
                }

                if (id.startsWith('minimize-')) {
                    return { type: 'minimize', track: parseInt(id.split('-')[1]) };
                }

                if (id.startsWith('header-')) {
                    return { type: 'header', track: parseInt(id.split('-')[1]) };
                }

                if (id.startsWith('index-')) {
                    return { type: 'index', index: parseInt(id.split('-')[1]) };
                }
            }

            current = current.parentElement;
        }

        return null;
    }

    toggleStep(track, step, subdivisionPath) {
        const pattern = this.currentSection.tracks[track].pattern;
        const currentStep = pattern[step];

        if (subdivisionPath && subdivisionPath.length > 0) {
            let targetStep = currentStep;

            for (const subIndex of subdivisionPath) {
                if (targetStep && targetStep.subdivide && targetStep.pattern) {
                    targetStep = targetStep.pattern[subIndex];
                } else {
                    return;
                }
            }

            if (targetStep && targetStep.type === 'step') {
                const wasActive = targetStep.fire === 1;
                targetStep.fire = targetStep.fire ? 0 : 1;

                // Preview note if activating and player is stopped
                if (!wasActive && targetStep.fire === 1 && !this.player.isPlaying) {
                    const { note, channel } = this.getStepNoteAndChannel(targetStep, this.currentSection.tracks[track]);
                    this.playNotePreview(note, channel);
                }

                // Update track states since step data changed
                this.player.updateTrackStates();
            }
        } else {
            if (currentStep.type === 'step') {
                const wasActive = currentStep.fire === 1;
                currentStep.fire = currentStep.fire ? 0 : 1;

                // Preview note if activating and player is stopped
                if (!wasActive && currentStep.fire === 1 && !this.player.isPlaying) {
                    const { note, channel } = this.getStepNoteAndChannel(currentStep, this.currentSection.tracks[track]);
                    this.playNotePreview(note, channel);
                }

                // Update track states since step data changed
                this.player.updateTrackStates();
            }
        }
    }

    selectTrack(track) {
        this.clearSelection();

        this.selection = {
            type: 'track',
            trackIndex: track,
            stepIndices: new Set(),
            subdivisionPath: null
        };

        this.currentSection.tracks.forEach((t, i) => {
            if (!t.layout) t.layout = {};
            t.layout.selected = (i === track);
        });
    }

    toggleMinimize(track) {
        if (!this.currentSection.tracks[track].layout) {
            this.currentSection.tracks[track].layout = {};
        }
        this.currentSection.tracks[track].layout.minimized = !this.currentSection.tracks[track].layout.minimized;
    }

    extendSelectionIfExists(direction) {
        // If nothing is selected or track is selected, do nothing
        if (this.selection.type === 'none' || this.selection.type === 'track') {
            return;
        }

        if (this.selection.type === 'steps') {
            this.extendRegularStepSelection(direction);
        } else if (this.selection.type === 'subdivision') {
            this.extendSingleSubdivisionStep(direction);
        } else if (this.selection.type === 'subdivision-steps') {
            this.extendMultipleSubdivisionSteps(direction);
        }

        this.render("extendSelectionIfExists");
        this.updateContextMenu();
    }

    extendRegularStepSelection(direction) {
        const trackIndex = this.selection.trackIndex;
        const track = this.currentSection.tracks[trackIndex];
        const stepIndices = Array.from(this.selection.stepIndices).sort((a, b) => a - b);

        let newStepIndex;
        if (direction > 0) {
            // Extending to the right
            newStepIndex = stepIndices[stepIndices.length - 1] + 1;
        } else {
            // Extending to the left
            newStepIndex = stepIndices[0] - 1;
        }

        // Check bounds
        if (newStepIndex < 0 || newStepIndex >= track.pattern.length) {
            return;
        }

        // Check if the new step is a subdivision (can't select across subdivisions)
        const newStep = track.pattern[newStepIndex];
        if (newStep && newStep.subdivide) {
            return;
        }

        // Check if there are any subdivisions between current selection and new step
        if (direction > 0) {
            // Check from last selected to new step
            const startCheck = stepIndices[stepIndices.length - 1] + 1;
            for (let i = startCheck; i <= newStepIndex; i++) {
                const checkStep = track.pattern[i];
                if (checkStep && checkStep.subdivide) {
                    return; // Can't extend across subdivision
                }
            }
        } else {
            // Check from new step to first selected
            const endCheck = stepIndices[0] - 1;
            for (let i = newStepIndex; i <= endCheck; i++) {
                const checkStep = track.pattern[i];
                if (checkStep && checkStep.subdivide) {
                    return; // Can't extend across subdivision
                }
            }
        }

        // Add the new step to selection
        this.selection.stepIndices.add(newStepIndex);
    }

    extendSingleSubdivisionStep(direction) {
        const currentPath = this.selection.subdivisionPath;
        const parentPath = currentPath.slice(0, -1);
        const currentSubIndex = currentPath[currentPath.length - 1];

        // Get the subdivision container
        const subdivision = this.navigateToSubdivision(this.selection.trackIndex, parentPath);
        if (!subdivision || !subdivision.pattern) return;

        const newSubIndex = currentSubIndex + direction;

        // Check if we can extend within the same subdivision
        if (newSubIndex >= 0 && newSubIndex < subdivision.pattern.length) {
            // Convert to multi-selection and add the new index
            this.selection = {
                type: 'subdivision-steps',
                trackIndex: this.selection.trackIndex,
                stepIndices: this.selection.stepIndices,
                subdivisionPath: [...parentPath, new Set([currentSubIndex, newSubIndex])]
            };
        }
    }

    eextendMultipleSubdivisionSteps(direction) {
        const parentPath = this.selection.subdivisionPath.slice(0, -1);
        const selectedIndices = this.selection.subdivisionPath[this.selection.subdivisionPath.length - 1];

        // Get the subdivision container
        const subdivision = this.navigateToSubdivision(this.selection.trackIndex, parentPath);
        if (!subdivision || !subdivision.pattern) return;

        // Find the edge index to extend from
        const sortedIndices = Array.from(selectedIndices).sort((a, b) => a - b);
        let newIndex;

        if (direction > 0) {
            // Extending to the right
            newIndex = sortedIndices[sortedIndices.length - 1] + 1;
        } else {
            // Extending to the left
            newIndex = sortedIndices[0] - 1;
        }

        // Check if we can extend within the same subdivision
        if (newIndex >= 0 && newIndex < subdivision.pattern.length) {
            selectedIndices.add(newIndex);
        }
    }

    clearSelection() {
        this.selection = {
            type: 'none',
            trackIndex: -1,
            stepIndices: new Set(),
            subdivisionPath: null
        };

        this.currentSection.tracks.forEach(track => {
            if (track.layout) track.layout.selected = false;
        });
    }

    getDisplayStepNumber(trackIndex, stepIndex) {
        const track = this.currentSection.tracks[trackIndex];
        let displayIndex = 1; // Start counting from 1

        for (let i = 0; i < stepIndex && i < track.pattern.length; i++) {
            const step = track.pattern[i];
            if (step.subdivide) {
                displayIndex += step.span || 1;
            } else {
                displayIndex += 1;
            }
        }

        return displayIndex;
    }

    getDisplaySubdivisionStepNumber(trackIndex, subdivisionPath) {
        if (!subdivisionPath || subdivisionPath.length === 0) return 1;

        const track = this.currentSection.tracks[trackIndex];
        let displayIndex = 1; // Start counting from 1

        // Count steps before the subdivision
        const mainStepIndex = subdivisionPath[0];
        for (let i = 0; i < mainStepIndex && i < track.pattern.length; i++) {
            const step = track.pattern[i];
            if (step.subdivide) {
                displayIndex += step.span || 1;
            } else {
                displayIndex += 1;
            }
        }

        // Add the subdivision step offset
        if (subdivisionPath.length > 1) {
            displayIndex += subdivisionPath[subdivisionPath.length - 1];
        }

        return displayIndex;
    }

    updateContextMenu() {
        // Update section display with track info
        this.updateSectionDisplay();

        // Update section controls based on the CURRENT SECTION being viewed/edited
        $('section-name-input').value = this.currentSection.name;
        $('section-repeat-input').value = this.currentSection.repeat || 1;
        $('section-bpm-input').value = this.currentSection.bpm || 120;

        // Update clone track button state
        this.updateCloneTrackButton();

        const selectionTitleText = $('selection-title-text');
        const noteInput = $('note-input');
        const channelInput = $('channel-input');
        const velocityInput = $('velocity-input');
        const modInput = $('mod-input');
        const oddsInput = $('odds-input');
        const breakButton = $('break-subdivision-button');
        const subdivideButton = $('subdivide-button');

        breakButton.style.display = (this.selection.type === 'subdivision' ||
            this.selection.type === 'subdivision-steps') ? 'inline-block' : 'none';

        subdivideButton.style.display = (this.selection.type === 'track') ? 'none' : 'inline-block';

        // Remove any playing section prefix logic - we only show the current section being edited

        switch (this.selection.type) {
            case 'track':
                const track = this.currentSection.tracks[this.selection.trackIndex];
                selectionTitleText.textContent = track.name;
                noteInput.value = track.defaults.note;
                channelInput.value = track.defaults.channel;
                velocityInput.value = track.defaults.velocity || 100;
                modInput.value = track.defaults.mod || '';
                oddsInput.value = track.defaults.odds || '';

                // Update pitch/octave/scale controls
                const trackScale = track.defaults.scale || 4095;
                this.updatePitchOctaveFromNote(track.defaults.note, trackScale);
                break;


            case 'steps':
                const stepIndices = Array.from(this.selection.stepIndices).sort((a, b) => a - b);
                const stepRangeText = stepIndices.length > 2 && this.isConsecutive(stepIndices)
                    ? `${stepIndices[0] + 1}-${stepIndices[stepIndices.length - 1] + 1}`
                    : stepIndices.map(i => i + 1).join(',');
                const stepsTrackName = this.currentSection.tracks[this.selection.trackIndex].name;
                selectionTitleText.textContent = `${stepsTrackName}: Step${stepIndices.length > 1 ? 's' : ''} ${stepRangeText}`;

                const firstStep = this.getFirstSelectedStep();
                if (firstStep) {
                    const stepsTrack = this.currentSection.tracks[this.selection.trackIndex];
                    noteInput.value = firstStep.note || stepsTrack.defaults.note;
                    channelInput.value = firstStep.channel || stepsTrack.defaults.channel;
                    velocityInput.value = firstStep.velocity || stepsTrack.defaults.velocity || 100;
                    modInput.value = firstStep.mod || '';
                    oddsInput.value = firstStep.odds || '';

                    // Update pitch/octave/scale controls
                    const stepNote = firstStep.note || stepsTrack.defaults.note;
                    const stepScale = firstStep.scale || stepsTrack.defaults.scale || 4095;
                    this.updatePitchOctaveFromNote(stepNote, stepScale);
                }
                break;

            case 'subdivision':
                const subdivisionInfo = this.getSubdivisionInfo();
                const subdivisionTrackName = this.currentSection.tracks[this.selection.trackIndex].name;

                if (this.selection.subdivisionPath.length === 1) {
                    const stepIndex = this.selection.subdivisionPath[0];
                    const subdivision = this.currentSection.tracks[this.selection.trackIndex].pattern[stepIndex];
                    const span = subdivision.span || 1;
                    const displayStartNumber = this.getDisplayStepNumber(this.selection.trackIndex, stepIndex);

                    if (span === 1) {
                        selectionTitleText.textContent = `${subdivisionTrackName}: Step ${displayStartNumber} (${subdivisionInfo.originalSteps}/${subdivisionInfo.subdivideCount})`;
                    } else {
                        const displayEndNumber = displayStartNumber + span - 1;
                        selectionTitleText.textContent = `${subdivisionTrackName}: Steps ${displayStartNumber}-${displayEndNumber} (${subdivisionInfo.originalSteps}/${subdivisionInfo.subdivideCount})`;
                    }
                } else {
                    // For individual subdivision steps, use the old nested path format
                    const nestedPath = this.formatNestedSubdivisionPath(this.selection.subdivisionPath);
                    selectionTitleText.textContent = `${subdivisionTrackName}: ${nestedPath}`;
                }

                const subStep = this.getSelectedSubdivisionStep();
                if (subStep && !subStep.subdivide) {
                    const subTrack = this.currentSection.tracks[this.selection.trackIndex];
                    noteInput.value = subStep.note || subTrack.defaults.note;
                    channelInput.value = subStep.channel || subTrack.defaults.channel;
                    velocityInput.value = subStep.velocity || subTrack.defaults.velocity || 100;
                    modInput.value = subStep.mod || '';
                    oddsInput.value = subStep.odds || '';

                    // Update pitch/octave/scale controls
                    const subStepNote = subStep.note || subTrack.defaults.note;
                    const subStepScale = subStep.scale || subTrack.defaults.scale || 4095;
                    this.updatePitchOctaveFromNote(subStepNote, subStepScale);
                } else {
                    const trackDefaults = this.currentSection.tracks[this.selection.trackIndex];
                    noteInput.value = trackDefaults.defaults.note;
                    channelInput.value = trackDefaults.defaults.channel;
                    velocityInput.value = trackDefaults.defaults.velocity || 100;
                    modInput.value = trackDefaults.defaults.mod || '';
                    oddsInput.value = trackDefaults.defaults.odds || '';

                    // Update pitch/octave/scale controls
                    const defaultScale = trackDefaults.defaults.scale || 4095;
                    this.updatePitchOctaveFromNote(trackDefaults.defaults.note, defaultScale);
                }
                break;

            case 'subdivision-steps':
                const subStepsTrackName = this.currentSection.tracks[this.selection.trackIndex].name;
                const subStepsPath = this.formatSubdivisionPath(this.selection.subdivisionPath.slice(0, -1));
                const selectedSubSteps = Array.from(this.selection.subdivisionPath[this.selection.subdivisionPath.length - 1]).sort((a, b) => a - b);
                const subStepRangeText = selectedSubSteps.length > 2 && this.isConsecutive(selectedSubSteps)
                    ? `${selectedSubSteps[0] + 1}-${selectedSubSteps[selectedSubSteps.length - 1] + 1}`
                    : selectedSubSteps.map(i => i + 1).join(',');
                selectionTitleText.textContent = `${subStepsTrackName}: ${subStepsPath}.${subStepRangeText}`;
                const firstSubStep = this.getFirstSelectedSubdivisionStep();
                if (firstSubStep) {
                    const firstSubTrack = this.currentSection.tracks[this.selection.trackIndex];
                    noteInput.value = firstSubStep.note || firstSubTrack.defaults.note;
                    channelInput.value = firstSubStep.channel || firstSubTrack.defaults.channel;
                    velocityInput.value = firstSubStep.velocity || firstSubTrack.defaults.velocity || 100;
                    modInput.value = firstSubStep.mod || '';
                    oddsInput.value = firstSubStep.odds || '';

                    // Update pitch/octave/scale controls
                    const subStepNote = firstSubStep.note || firstSubTrack.defaults.note;
                    const subStepScale = firstSubStep.scale || firstSubTrack.defaults.scale || 4095;
                    this.updatePitchOctaveFromNote(subStepNote, subStepScale);
                }
                break;

            default:
                // Show current section name instead of "No Selection"
                selectionTitleText.textContent = this.currentSection.name;
                noteInput.value = 36;
                channelInput.value = 9;
                velocityInput.value = 100;
                modInput.value = '';
                oddsInput.value = '';

                // Update pitch/octave/scale controls to defaults
                this.updatePitchOctaveFromNote(36, 4095);
        }
    }

    isConsecutive(numbers) {
        for (let i = 1; i < numbers.length; i++) {
            if (numbers[i] !== numbers[i - 1] + 1) {
                return false;
            }
        }
        return true;
    }

    formatSubdivisionPath(path) {
        if (!path || path.length === 0) return '';
        if (path.length === 1) {
            return `Step ${path[0] + 1}`;
        }
        return `Step ${path[0] + 1}.${path.slice(1).map(i => i + 1).join('.')}`;
    }

    updateSectionDisplay() {
        const sectionDisplay = $('section-display');
        if (!sectionDisplay) return;

        let displayText = this.currentSection.name;

        // Add track info if a track is selected
        if (this.selection.type === 'track' && this.selection.trackIndex >= 0) {
            const selectedTrack = this.currentSection.tracks[this.selection.trackIndex];
            if (selectedTrack) {
                displayText += `: ${selectedTrack.name}`;
            }
        }

        sectionDisplay.textContent = displayText;
    }


    updateCloneTrackButton() {
        const cloneTrackButton = $('clone-track-button');
        if (!cloneTrackButton) return;

        // Enable button only if a track is selected
        const isTrackSelected = this.selection.type === 'track' &&
            this.selection.trackIndex >= 0 &&
            this.selection.trackIndex < this.currentSection.tracks.length;

        cloneTrackButton.disabled = !isTrackSelected;
    }

    formatNestedSubdivisionPath(path) {
        if (!path || path.length === 0) return '';

        let result = '';
        let currentTrack = this.currentSection.tracks[this.selection.trackIndex];
        let currentPattern = currentTrack.pattern;

        for (let i = 0; i < path.length; i++) {
            const stepIndex = path[i];
            const currentStep = currentPattern[stepIndex];

            if (i === 0) {
                if (currentStep.subdivide) {
                    const span = currentStep.span || 1;
                    if (span === 1) {
                        result = `Step ${stepIndex + 1}(${currentStep.span || 1}/${currentStep.subdivide})`;
                    } else {
                        const endStep = stepIndex + span - 1;
                        result = `Steps ${stepIndex + 1}-${endStep + 1}(${currentStep.span || 1}/${currentStep.subdivide})`;
                    }
                    currentPattern = currentStep.pattern;
                } else {
                    result = `Step ${stepIndex + 1}`;
                }
            } else {
                if (currentStep && currentStep.subdivide) {
                    const span = currentStep.span || 1;
                    if (span === 1) {
                        result += `.${stepIndex + 1}(${currentStep.span || 1}/${currentStep.subdivide})`;
                    } else {
                        const endIndex = stepIndex + span - 1;
                        result += `.${stepIndex + 1}-${endIndex + 1}(${currentStep.span || 1}/${currentStep.subdivide})`;
                    }
                    currentPattern = currentStep.pattern;
                } else {
                    result += `.${stepIndex + 1}`;
                }
            }
        }

        return result;
    }

    getSubdivisionInfo() {
        if (!this.selection.subdivisionPath || this.selection.subdivisionPath.length < 1) {
            return { originalSteps: 0, subdivideCount: 0 };
        }

        const subdivision = this.navigateToSubdivision(this.selection.trackIndex, this.selection.subdivisionPath);

        if (subdivision && subdivision.subdivide) {
            return {
                originalSteps: subdivision.span || 1,
                subdivideCount: subdivision.subdivide
            };
        }

        return { originalSteps: 0, subdivideCount: 0 };
    }

    navigateToSubdivision(trackIndex, path) {
        if (!path || path.length === 0) return null;

        const track = this.currentSection.tracks[trackIndex];
        if (!track || !track.pattern) return null;

        let currentElement = track.pattern[path[0]];

        for (let i = 1; i < path.length; i++) {
            if (currentElement && currentElement.subdivide && currentElement.pattern) {
                currentElement = currentElement.pattern[path[i]];
            } else {
                return null;
            }
        }

        return currentElement;
    }

    getSelectedSubdivisionStep() {
        if (this.selection.type !== 'subdivision' || !this.selection.subdivisionPath || this.selection.subdivisionPath.length < 2) {
            return null;
        }

        return this.navigateToSubdivision(this.selection.trackIndex, this.selection.subdivisionPath);
    }

    getFirstSelectedSubdivisionStep() {
        if (this.selection.type === 'subdivision-steps' && this.selection.subdivisionPath) {
            const pathWithoutSet = this.selection.subdivisionPath.slice(0, -1);
            const selectedSubSteps = this.selection.subdivisionPath[this.selection.subdivisionPath.length - 1];

            const subdivision = this.navigateToSubdivision(this.selection.trackIndex, pathWithoutSet);

            if (subdivision && subdivision.subdivide && subdivision.pattern && selectedSubSteps.size > 0) {
                const firstSubIndex = Math.min(...selectedSubSteps);
                return subdivision.pattern[firstSubIndex];
            }
        }
        return null;
    }

    getFirstSelectedStep() {
        if (this.selection.type !== 'steps' || this.selection.stepIndices.size === 0) {
            return null;
        }

        const firstStepIndex = Math.min(...this.selection.stepIndices);
        return this.currentSection.tracks[this.selection.trackIndex].pattern[firstStepIndex];
    }

    applyNote() {
        const note = parseInt($('note-input').value);
        this.applyToSelection('note', note);
    }

    applyChannel() {
        const channel = parseInt($('channel-input').value);
        this.applyToSelection('channel', channel);
    }

    applyVelocity() {
        const velocity = parseInt($('velocity-input').value);

        // Clamp velocity to valid range
        const clampedVelocity = Math.max(1, Math.min(127, velocity));

        // Update input if it was clamped
        if (clampedVelocity !== velocity) {
            $('velocity-input').value = clampedVelocity;
        }

        if (this.selection.type === 'track') {
            // For track selection, set defaults AND update existing explicit values
            const track = this.currentSection.tracks[this.selection.trackIndex];

            // 1. Set track defaults
            track.defaults.velocity = clampedVelocity;

            // 2. Update any existing explicit velocity values
            this.setVelocityInTrackExplicitValues(track, clampedVelocity);
        } else {
            // For all other selections, apply to the selected steps
            this.applyVelocityToAllSelected(clampedVelocity, true);
        }

        // Update the visual display
        this.player.updateTrackStates();
        this.render("applyVelocity");
        this.updateContextMenu();
    }

    applyVelocityToAllSelected(velocity, activate) {
        switch (this.selection.type) {
            case 'track':
                const track = this.currentSection.tracks[this.selection.trackIndex];
                track.defaults.velocity = velocity;
                break;

            case 'steps':
                this.selection.stepIndices.forEach(stepIndex => {
                    const step = this.currentSection.tracks[this.selection.trackIndex].pattern[stepIndex];
                    if (step && step.type === 'step') {
                        step.velocity = velocity;
                        if (activate) step.fire = 1;
                    }
                });
                break;

            case 'subdivision':
                const subStep = this.getSelectedSubdivisionStep();
                if (subStep && subStep.type === 'step') {
                    subStep.velocity = velocity;
                    if (activate) subStep.fire = 1;
                }
                break;

            case 'subdivision-steps':
                if (this.selection.subdivisionPath && this.selection.subdivisionPath.length >= 2) {
                    const pathWithoutSet = this.selection.subdivisionPath.slice(0, -1);
                    const selectedSubSteps = this.selection.subdivisionPath[this.selection.subdivisionPath.length - 1];
                    const subdivision = this.navigateToSubdivision(this.selection.trackIndex, pathWithoutSet);

                    if (subdivision && subdivision.pattern) {
                        selectedSubSteps.forEach(subIndex => {
                            const subStep = subdivision.pattern[subIndex];
                            if (subStep && subStep.type === 'step') {
                                subStep.velocity = velocity;
                                if (activate) subStep.fire = 1;
                            }
                        });
                    }
                }
                break;
        }
    }


    setVelocityInTrackExplicitValues(track, velocity) {
        this.setVelocityInPatternExplicitValues(track.pattern, velocity);
    }

    setVelocityInPatternExplicitValues(pattern, velocity) {
        pattern.forEach(step => {
            if (step.type === 'step') {
                // Only set if the step has explicit velocity
                if (step.velocity !== undefined) {
                    step.velocity = velocity;
                    step.fire = 1; // Activate when setting velocity
                }
                // If no explicit velocity, leave it alone (will use defaults)
            } else if (step.subdivide && step.pattern) {
                // Recursively process subdivisions
                this.setVelocityInPatternExplicitValues(step.pattern, velocity);
            }
        });
    }

    applyMod() {
        const modValue = $('mod-input').value;
        if (modValue === '') {
            this.applyToSelection('mod', undefined);
        } else {
            const mod = parseInt(modValue);
            this.applyToSelection('mod', mod);
        }
    }

    numberToScale(number = 4095) {
        if (number < 0 || number > 4095) {
            console.log("Input number must be odd and between 0 and 4095. Using major (2741) instead.");
            number = 2741;
        }
        if (number % 2 === 0) {
            console.log("Even numbers don't create a 'real' scale");
        }
        const binaryString = (number >>> 0).toString(2).padStart(12, '0');
        const bits = binaryString.split('');
        const scale = bits.reduce(function (acc, bit, i) {
            if (bit === '1') {
                acc.unshift(11 - i); // Prepend note index
            }
            return acc;
        }, []);
        return scale;
    }

    pitchFromNote(note) {
        return note % 12;
    }

    octaveFromNote(note) {
        return Math.floor(note / 12);
    }


    isTrackMaximized(trackIndex) {
        const track = this.currentSection.tracks[trackIndex];
        return !track.layout?.minimized;
    }

    // Check if step has pitch for visualization
    stepHasPitch(step, track) {
        if (!this.isCurrentTabMelody()) return false;
        if (track.layout?.minimized) return false; // Don't show pitch for minimized tracks

        // Show pitch visualization if:
        // 1. Step is active AND has explicit pitch/note, OR
        // 2. Step is active AND track has default pitch/note (as fallback)
        if (step.fire === 1) {
            return (step.pitch !== undefined || step.note !== undefined ||
                track.defaults.pitch !== undefined || track.defaults.note !== undefined);
        }

        return false;
    }

    // Calculate pitch height for visualization
    getPitchHeight(step, track) {
        if (!this.isCurrentTabMelody()) return null;

        let pitch, scale, octave;

        // Get scale - use step's explicit value or track default
        scale = step.scale || track.defaults.scale || 4095;

        // Get pitch value - priority order: step.pitch > calculated from step.note > track.defaults.pitch > calculated from track.defaults.note
        if (step.pitch !== undefined) {
            // Step has explicit pitch
            pitch = step.pitch;
        } else if (step.note !== undefined) {
            // Calculate pitch from step's explicit note
            octave = step.octave || track.defaults.octave || 3;
            pitch = this.pitchFromNoteAndScale(step.note, octave, scale);
        } else if (track.defaults.pitch !== undefined) {
            // Use track's default pitch
            pitch = track.defaults.pitch;
        } else if (track.defaults.note !== undefined) {
            // Calculate pitch from track's default note
            octave = track.defaults.octave || 3;
            pitch = this.pitchFromNoteAndScale(track.defaults.note, octave, scale);
        } else {
            // No pitch information available
            pitch = 0;
        }

        const pitchClasses = this.numberToScale(scale);
        const maxPitch = pitchClasses.length - 1;

        if (maxPitch === 0) return 10; // Single note scale

        // Clamp pitch to valid range
        const clampedPitch = Math.max(0, Math.min(pitch, maxPitch));

        // Calculate height percentage (10% minimum, 100% maximum)
        const heightPercent = clampedPitch === 0 ? 10 : 10 + (clampedPitch / maxPitch) * 90;

        return heightPercent;
    }

    pitchFromNoteAndScale(note, octave, scale = 4095) {
        // Get the pitch class (0-11) from the note
        const pitchClass = note % 12;

        // Get the scale notes
        const scaleNotes = this.numberToScale(scale);

        // Find the closest scale degree to this pitch class
        let closestIndex = 0;
        let minDistance = Math.abs(scaleNotes[0] - pitchClass);

        for (let i = 1; i < scaleNotes.length; i++) {
            const distance = Math.abs(scaleNotes[i] - pitchClass);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = i;
            }
        }

        return closestIndex;
    }
    handleMelodyClick(e, action) {
        const stepElement = e.target.closest('.step, .subdivision-step');
        if (!stepElement) return;

        const rect = stepElement.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const stepHeight = rect.height;

        // Calculate pitch based on click position (bottom = 0, top = max)
        const clickRatio = 1 - (clickY / stepHeight);

        const clickedStep = this.getStepFromAction(action);
        const track = this.currentSection.tracks[action.track];

        if (!clickedStep) return;

        // Get scale to determine pitch range
        const scale = clickedStep.scale || track.defaults.scale || 4095;
        const pitchClasses = this.numberToScale(scale);
        const maxPitch = pitchClasses.length - 1;

        let targetPitch, targetOctave, targetNote, shouldActivate;

        // If clicking at very bottom (bottom 10%), turn off the step
        if (clickRatio < 0.1) {
            shouldActivate = false;
            targetPitch = undefined;
            targetNote = undefined;
            targetOctave = undefined;
        } else {
            // Calculate pitch from click position
            const calculatedPitch = Math.round(clickRatio * maxPitch);

            // Check if step is already active with this pitch
            if (clickedStep.fire === 1) {
                // Get current pitch of the step
                let currentPitch;
                if (clickedStep.pitch !== undefined) {
                    currentPitch = clickedStep.pitch;
                } else if (clickedStep.note !== undefined) {
                    const currentOctave = clickedStep.octave || track.defaults.octave || 3;
                    currentPitch = this.pitchFromNoteAndScale(clickedStep.note, currentOctave, scale);
                } else {
                    // Using track defaults
                    if (track.defaults.pitch !== undefined) {
                        currentPitch = track.defaults.pitch;
                    } else if (track.defaults.note !== undefined) {
                        const defaultOctave = track.defaults.octave || 3;
                        currentPitch = this.pitchFromNoteAndScale(track.defaults.note, defaultOctave, scale);
                    } else {
                        currentPitch = 0;
                    }
                }

                // If clicking the same pitch, toggle the step off
                if (calculatedPitch === currentPitch) {
                    shouldActivate = false;
                    targetPitch = undefined;
                    targetNote = undefined;
                    targetOctave = undefined;
                } else {
                    // Different pitch - set new pitch
                    shouldActivate = true;
                    targetPitch = calculatedPitch;
                    targetOctave = clickedStep.octave || track.defaults.octave || 3;
                    targetNote = this.noteFromPitchOctaveScale(targetPitch, targetOctave, scale);
                }
            } else {
                // Step is inactive - activate with new pitch
                shouldActivate = true;
                targetPitch = calculatedPitch;
                targetOctave = clickedStep.octave || track.defaults.octave || 3;
                targetNote = this.noteFromPitchOctaveScale(targetPitch, targetOctave, scale);
            }
        }

        // Play note preview if changing pitch and player is stopped
        if (shouldActivate && targetNote !== undefined && !this.player.isPlaying) {
            const channel = clickedStep.channel || track.defaults.channel || 9;
            this.playNotePreview(targetNote, channel);
        }

        // Apply to the specific clicked step
        this.applyPitchToSpecificStep(action, targetPitch, targetOctave, targetNote, shouldActivate);

        // Update context menu to reflect changes
        this.updateContextMenuInputsFromSelection();

        this.player.updateTrackStates();
    }


    applyPitchToSpecificStep(action, pitch, octave, note, activate) {
        const step = this.getStepFromAction(action);

        if (step && step.type === 'step') {
            step.fire = activate ? 1 : 0;
            if (activate) {
                step.pitch = pitch;
                step.octave = octave;
                step.note = note;
            } else {
                // Clear pitch-related properties when deactivating
                delete step.pitch;
                delete step.octave;
                delete step.note;
            }
        }
    }

    // New method to apply same pitch to all selected steps
    applyPitchToAllSelected(pitch, octave, note, activate) {
        switch (this.selection.type) {
            case 'track':
                const track = this.currentSection.tracks[this.selection.trackIndex];
                if (activate) {
                    track.defaults.pitch = pitch;
                    track.defaults.octave = octave;
                    track.defaults.note = note;
                }
                break;

            case 'steps':
                this.selection.stepIndices.forEach(stepIndex => {
                    const step = this.currentSection.tracks[this.selection.trackIndex].pattern[stepIndex];
                    if (step && step.type === 'step') {
                        step.fire = activate ? 1 : 0;
                        if (activate) {
                            step.pitch = pitch;
                            step.octave = octave;
                            step.note = note;
                        } else {
                            delete step.pitch;
                            delete step.octave;
                            delete step.note;
                        }
                    }
                });
                break;

            case 'subdivision':
                const subStep = this.getSelectedSubdivisionStep();
                if (subStep && subStep.type === 'step') {
                    subStep.fire = activate ? 1 : 0;
                    if (activate) {
                        subStep.pitch = pitch;
                        subStep.octave = octave;
                        subStep.note = note;
                    } else {
                        delete subStep.pitch;
                        delete subStep.octave;
                        delete subStep.note;
                    }
                }
                break;

            case 'subdivision-steps':
                if (this.selection.subdivisionPath && this.selection.subdivisionPath.length >= 2) {
                    const pathWithoutSet = this.selection.subdivisionPath.slice(0, -1);
                    const selectedSubSteps = this.selection.subdivisionPath[this.selection.subdivisionPath.length - 1];
                    const subdivision = this.navigateToSubdivision(this.selection.trackIndex, pathWithoutSet);

                    if (subdivision && subdivision.pattern) {
                        selectedSubSteps.forEach(subIndex => {
                            const subStep = subdivision.pattern[subIndex];
                            if (subStep && subStep.type === 'step') {
                                subStep.fire = activate ? 1 : 0;
                                if (activate) {
                                    subStep.pitch = pitch;
                                    subStep.octave = octave;
                                    subStep.note = note;
                                } else {
                                    delete subStep.pitch;
                                    delete subStep.octave;
                                    delete subStep.note;
                                }
                            }
                        });
                    }
                }
                break;
        }
    }

    isStepInCurrentSelection(action) {
        if (this.selection.type === 'none') return false;
        if (this.selection.trackIndex !== action.track) return false;

        switch (this.selection.type) {
            case 'steps':
                return this.selection.stepIndices.has(action.step);

            case 'subdivision':
                if (!action.subdivisionPath || action.subdivisionPath.length === 0) return false;
                const targetPath = [action.step, ...action.subdivisionPath];
                return this.arraysEqual(this.selection.subdivisionPath, targetPath);

            case 'subdivision-steps':
                if (!action.subdivisionPath || action.subdivisionPath.length === 0) return false;
                const parentPath = this.selection.subdivisionPath.slice(0, -1);
                const selectedSubSteps = this.selection.subdivisionPath[this.selection.subdivisionPath.length - 1];
                const targetParentPath = [action.step, ...action.subdivisionPath.slice(0, -1)];
                const targetSubStep = action.subdivisionPath[action.subdivisionPath.length - 1];

                return this.arraysEqual(parentPath, targetParentPath) &&
                    selectedSubSteps.has(targetSubStep);

            case 'track':
                return true; // All steps in track are part of selection

            default:
                return false;
        }
    }

    // Get step from action
    getStepFromAction(action) {
        const track = this.currentSection.tracks[action.track];

        if (action.subdivisionPath && action.subdivisionPath.length > 0) {
            // For subdivision steps, navigate through the subdivision path
            let targetStep = track.pattern[action.step];

            for (const subIndex of action.subdivisionPath) {
                if (targetStep && targetStep.subdivide && targetStep.pattern) {
                    targetStep = targetStep.pattern[subIndex];
                } else {
                    return null;
                }
            }
            return targetStep;
        } else {
            // For regular steps, return the step directly
            return track.pattern[action.step];
        }
    }

    applyPitch() {
        const pitch = parseInt($('pitch-input').value);
        const octave = parseInt($('octave-input').value) || 3;
        const scale = parseInt($('scale-input').value) || 4095;
        const note = this.noteFromPitchOctaveScale(pitch, octave, scale);

        $('note-input').value = note;

        if (this.selection.type === 'track') {
            // For track selection, set defaults AND update existing explicit values
            const track = this.currentSection.tracks[this.selection.trackIndex];

            // 1. Set track defaults
            track.defaults.pitch = pitch;
            track.defaults.octave = octave;
            track.defaults.note = note;

            // 2. Update any existing explicit values
            this.setPitchInTrackExplicitValues(track, pitch, octave, note);
        } else {
            // For all other selections, apply to the selected steps
            this.applyPitchToAllSelected(pitch, octave, note, true);
        }

        // Update the visual display
        this.player.updateTrackStates();
        this.render("applyPitch");
    }

    applyOctave() {
        const octave = parseInt($('octave-input').value);
        const pitch = parseInt($('pitch-input').value) || 0;
        const scale = parseInt($('scale-input').value) || 4095;
        const note = this.noteFromPitchOctaveScale(pitch, octave, scale);

        $('note-input').value = note;

        if (this.selection.type === 'track') {
            // For track selection, set defaults AND update existing explicit values
            const track = this.currentSection.tracks[this.selection.trackIndex];

            // 1. Set track defaults
            track.defaults.pitch = pitch;
            track.defaults.octave = octave;
            track.defaults.note = note;

            // 2. Update any existing explicit values
            this.setPitchInTrackExplicitValues(track, pitch, octave, note);
        } else {
            // For all other selections, apply to the selected steps
            this.applyPitchToAllSelected(pitch, octave, note, true);
        }

        // Update the visual display
        this.player.updateTrackStates();
        this.render("applyOctave");
    }

    applyScale() {
        const scale = parseInt($('scale-input').value);
        const pitch = parseInt($('pitch-input').value) || 0;
        const octave = parseInt($('octave-input').value) || 3;

        this.applyToSelection('scale', scale);

        // If not chromatic, recalculate note
        if (scale !== 4095) {
            const note = this.noteFromPitchOctaveScale(pitch, octave, scale);
            $('note-input').value = note;
            this.applyNote();
        }
    }

    applyOdds() {
        const oddsValue = $('odds-input').value;
        if (oddsValue === '') {
            this.applyToSelection('odds', undefined);
        } else {
            const odds = parseFloat(oddsValue);
            this.applyToSelection('odds', odds);
        }
    }

    applyToSelection(property, value) {
        switch (this.selection.type) {
            case 'track':
                if (property === 'note' || property === 'channel' || property === 'mod' || property === 'odds' || property === 'scale') {
                    if (value === undefined) {
                        delete this.currentSection.tracks[this.selection.trackIndex].defaults[property];
                    } else {
                        this.currentSection.tracks[this.selection.trackIndex].defaults[property] = value;
                    }
                    this.selectionChanged = true;
                }
                break;

            case 'steps':
                this.selection.stepIndices.forEach(stepIndex => {
                    const step = this.currentSection.tracks[this.selection.trackIndex].pattern[stepIndex];
                    if (step && step.type === 'step') {
                        if (value === undefined) {
                            delete step[property];
                        } else {
                            step[property] = value;
                        }
                        this.selectionChanged = true;
                    }
                });
                break;

            case 'subdivision':
                const subStep = this.getSelectedSubdivisionStep();
                if (subStep && subStep.type === 'step') {
                    if (value === undefined) {
                        delete subStep[property];
                    } else {
                        subStep[property] = value;
                    }
                    this.selectionChanged = true;
                }
                break;

            case 'subdivision-steps':
                if (this.selection.subdivisionPath && this.selection.subdivisionPath.length >= 2) {
                    const pathWithoutSet = this.selection.subdivisionPath.slice(0, -1);
                    const selectedSubSteps = this.selection.subdivisionPath[this.selection.subdivisionPath.length - 1];
                    const subdivision = this.navigateToSubdivision(this.selection.trackIndex, pathWithoutSet);

                    if (subdivision && subdivision.pattern) {
                        selectedSubSteps.forEach(subIndex => {
                            const subStep = subdivision.pattern[subIndex];
                            if (subStep && subStep.type === 'step') {
                                if (value === undefined) {
                                    delete subStep[property];
                                } else {
                                    subStep[property] = value;
                                }
                                this.selectionChanged = true;
                            }
                        });
                    }
                }
                break;
        }

        // Only update track states when data actually changed
        if (this.selectionChanged) {
            this.player.updateTrackStates();
        }
        this.render("applyToSelection");
    }
    applyInverse() {
        if (this.selection.type === 'none') return;
        switch (this.selection.type) {
            case 'track':
                this.inverseTrackRecursive(this.selection.trackIndex);
                this.selectionChanged = true;
                break;

            case 'steps':
                this.inverseSelection();
                this.selectionChanged = true;
                break;

            case 'subdivision':
                this.inverseSubdivision();
                this.selectionChanged = true;
                break;

            case 'subdivision-steps':
                this.inverseSubdivisionSteps();
                this.selectionChanged = true;
                break;
        }

        this.player.updateTrackStates();
        this.render("applyInverse");
    }

    applyRotate(direction, rotateAmount = 1) {
        switch (this.selection.type) {
            case 'track':
                this.rotateTrack(this.selection.trackIndex, direction, rotateAmount);
                this.selectionChanged = true;
                break;

            case 'steps':
                this.rotateSelection(direction, rotateAmount);
                this.selectionChanged = true;
                break;

            case 'subdivision-container':
                this.rotateSubdivisionContainer(direction, rotateAmount);
                this.selectionChanged = true;
                break;
        }

        if (this.selectionChanged) {
            this.player.updateTrackStates();
            this.render("applyRotate");
        }
    }

    inverseTrackRecursive(trackIndex) {
        const track = this.currentSection.tracks[trackIndex];
        this.inversePatternRecursive(track.pattern);
    }

    inversePatternRecursive(pattern) {
        pattern.forEach(step => {
            if (step.type === 'step') {
                step.fire = step.fire ? 0 : 1;
            } else if (step.subdivide && step.pattern) {
                this.inversePatternRecursive(step.pattern);
            }
        });
    }

    inverseSubdivisionSteps() {
        if (this.selection.subdivisionPath && this.selection.subdivisionPath.length >= 2) {
            const pathWithoutSet = this.selection.subdivisionPath.slice(0, -1);
            const selectedSubSteps = this.selection.subdivisionPath[this.selection.subdivisionPath.length - 1];
            const subdivision = this.navigateToSubdivision(this.selection.trackIndex, pathWithoutSet);

            if (subdivision && subdivision.pattern) {
                selectedSubSteps.forEach(subIndex => {
                    const subStep = subdivision.pattern[subIndex];
                    if (subStep && subStep.type === 'step') {
                        subStep.fire = subStep.fire ? 0 : 1;
                    }
                });
            }
        }
    }

    rotateTrack(trackIndex, direction, rotateAmount = 1) {
        const track = this.currentSection.tracks[trackIndex];
        const pattern = track.pattern;

        // Apply rotation rotateAmount times
        for (let i = 0; i < rotateAmount; i++) {
            if (direction > 0) {
                const last = pattern.pop();
                pattern.unshift(last);
            } else {
                const first = pattern.shift();
                pattern.push(first);
            }
        }
    }

    rotateSelection(direction, rotateAmount = 1) {
        const stepIndices = Array.from(this.selection.stepIndices).sort((a, b) => a - b);
        const track = this.currentSection.tracks[this.selection.trackIndex];

        const selectedSteps = stepIndices.map(i => track.pattern[i]);

        // Apply rotation rotateAmount times
        for (let i = 0; i < rotateAmount; i++) {
            if (direction > 0) {
                const last = selectedSteps.pop();
                selectedSteps.unshift(last);
            } else {
                const first = selectedSteps.shift();
                selectedSteps.push(first);
            }
        }

        stepIndices.forEach((stepIndex, i) => {
            track.pattern[stepIndex] = selectedSteps[i];
        });
    }

    rotateSubdivisionContainer(direction, rotateAmount = 1) {
        if (!this.selection.subdivisionPath) return;

        const subdivision = this.navigateToSubdivision(this.selection.trackIndex, this.selection.subdivisionPath);

        if (subdivision && subdivision.subdivide && subdivision.pattern) {
            const pattern = subdivision.pattern;

            // Apply rotation rotateAmount times
            for (let i = 0; i < rotateAmount; i++) {
                if (direction > 0) {
                    const last = pattern.pop();
                    pattern.unshift(last);
                } else {
                    const first = pattern.shift();
                    pattern.push(first);
                }
            }
        }
    }

    inverseSelection() {
        if (this.selection) {
            if (this.selection.type === 'none') return;
            this.selection.stepIndices.forEach(stepIndex => {
                const step = this.currentSection.tracks[this.selection.trackIndex].pattern[stepIndex];
                if (step && step.type === 'step') {
                    step.fire = step.fire ? 0 : 1;
                }
            });
        }
    }

    inverseSubdivision() {
        const subStep = this.getSelectedSubdivisionStep();
        if (subStep && subStep.type === 'step') {
            subStep.fire = subStep.fire ? 0 : 1;
        }
    }

    moveSelection(direction) {
        if (this.selection.type === 'none') return;

        // Special handling for track selection
        if (this.selection.type === 'track') {
            if (direction > 0) {
                // Moving right from track header - go to first step of the track
                this.moveToFirstStepOfTrack(this.selection.trackIndex);
                return;
            } else {
                // Moving left from track header - go to last step of the track
                this.moveToLastStepOfTrack(this.selection.trackIndex);
                return;
            }
        }

        // For multi-step selections, move the entire selection
        if (this.selection.type === 'steps' && this.selection.stepIndices.size > 1) {
            this.moveMultiStepSelection(direction);
            return;
        }

        // Store the current track index before we start moving
        const currentTrackIndex = this.selection.trackIndex;

        // Get the current flat position and move to the next/previous position
        const currentPosition = this.getCurrentFlatPosition();
        if (currentPosition === null) return;

        const newPosition = currentPosition + direction;
        const newSelection = this.getFlatPositionSelection(currentTrackIndex, newPosition);

        if (newSelection) {
            this.clearSelection();
            this.selection = newSelection;
            this.render("moveSelection");
            this.updateContextMenu();
        } else {
            // If we can't move to a new position, check for track header transitions
            if (direction < 0 && currentPosition === 0) {
                // Moving left from first step - go to track header
                this.clearSelection();
                this.selectTrack(currentTrackIndex);
                this.render("moveSelection: To header");
                this.updateContextMenu();
            } else if (direction > 0) {
                // Moving right from last step - go to track header
                const trackLength = this.getTotalTrackStepCount(currentTrackIndex);
                if (currentPosition === trackLength - 1) {
                    this.clearSelection();
                    this.selectTrack(currentTrackIndex);
                    this.render("moveSelection: To header");
                    this.updateContextMenu();
                }
            }
        }
    }

    moveMultiStepSelection(direction) {
        const trackIndex = this.selection.trackIndex;
        const track = this.currentSection.tracks[trackIndex];
        const stepIndices = Array.from(this.selection.stepIndices).sort((a, b) => a - b);

        let newIndices;
        if (direction > 0) {
            // Moving right
            const maxIndex = stepIndices[stepIndices.length - 1] + 1;
            if (maxIndex >= track.pattern.length) return; // Can't move beyond track

            // Check if we can move all steps
            newIndices = stepIndices.map(i => i + 1);

            // Check for subdivisions in the new positions
            for (const newIndex of newIndices) {
                if (newIndex >= track.pattern.length) return;
                const step = track.pattern[newIndex];
                if (step && step.subdivide) return; // Can't move into subdivision
            }
        } else {
            // Moving left
            const minIndex = stepIndices[0] - 1;
            if (minIndex < 0) return; // Can't move before track start

            // Check if we can move all steps
            newIndices = stepIndices.map(i => i - 1);

            // Check for subdivisions in the new positions
            for (const newIndex of newIndices) {
                if (newIndex < 0) return;
                const step = track.pattern[newIndex];
                if (step && step.subdivide) return; // Can't move into subdivision
            }
        }

        // Update selection with new indices
        this.selection.stepIndices = new Set(newIndices);
        this.render("moveMultiStepSelection");
        this.updateContextMenu();
    }

    updateContextMenuInputsFromSelection() {
        let firstStep = null;
        let track = null;

        switch (this.selection.type) {
            case 'track':
                track = this.currentSection.tracks[this.selection.trackIndex];
                $('pitch-input').value = track.defaults.pitch || 0;
                $('note-input').value = track.defaults.note || 36;
                $('octave-input').value = track.defaults.octave || 3;
                $('scale-input').value = track.defaults.scale || 4095;
                break;

            case 'steps':
                firstStep = this.getFirstSelectedStep();
                track = this.currentSection.tracks[this.selection.trackIndex];
                if (firstStep) {
                    $('pitch-input').value = firstStep.pitch || 0;
                    $('note-input').value = firstStep.note || track.defaults.note;
                    $('octave-input').value = firstStep.octave || track.defaults.octave || 3;
                    $('scale-input').value = firstStep.scale || track.defaults.scale || 4095;
                }
                break;

            case 'subdivision':
            case 'subdivision-steps':
                firstStep = this.getFirstSelectedSubdivisionStep() || this.getSelectedSubdivisionStep();
                track = this.currentSection.tracks[this.selection.trackIndex];
                if (firstStep) {
                    $('pitch-input').value = firstStep.pitch || 0;
                    $('note-input').value = firstStep.note || track.defaults.note;
                    $('octave-input').value = firstStep.octave || track.defaults.octave || 3;
                    $('scale-input').value = firstStep.scale || track.defaults.scale || 4095;
                }
                break;
        }
    }

    getTotalTrackStepCount(trackIndex) {
        const track = this.currentSection.tracks[trackIndex];
        return this.getFlatStepCount(track.pattern);
    }

    moveToLastStepOfTrack(trackIndex) {
        const track = this.currentSection.tracks[trackIndex];
        if (!track.pattern || track.pattern.length === 0) return;

        const totalSteps = this.getTotalTrackStepCount(trackIndex);
        const lastStepSelection = this.getFlatPositionSelection(trackIndex, totalSteps - 1);

        if (lastStepSelection) {
            this.clearSelection();
            this.selection = lastStepSelection;
            this.render("moveToLastStepOfTrack");
            this.updateContextMenu();
        }
    }

    moveSelectionVertical(direction) {
        if (this.selection.type === 'none') return;

        const currentTrackIndex = this.selection.trackIndex;
        const newTrackIndex = currentTrackIndex + direction;

        // Check bounds
        if (newTrackIndex < 0 || newTrackIndex >= this.currentSection.tracks.length) {
            return;
        }

        this.clearSelection();
        this.selectTrack(newTrackIndex);
        this.render("moveSelectionVertical");
        this.updateContextMenu();
    }

    moveToFirstStepOfTrack(trackIndex) {
        const track = this.currentSection.tracks[trackIndex];
        if (!track.pattern || track.pattern.length === 0) return;

        const firstStep = track.pattern[0];

        this.clearSelection();
        if (firstStep.subdivide) {
            // If first element is a subdivision, select the subdivision container
            this.selection = {
                type: 'subdivision',
                trackIndex: trackIndex,
                stepIndices: new Set([0]),
                subdivisionPath: [0]
            };
        } else {
            // If first element is a regular step, select it
            this.selection = {
                type: 'steps',
                trackIndex: trackIndex,
                stepIndices: new Set([0]),
                subdivisionPath: null
            };
        }

        this.render("moveToFirstStepOfTrack");
        this.updateContextMenu();
    }

    getCurrentFlatPosition() {
        if (this.selection.type === 'none') return null;

        const trackIndex = this.selection.trackIndex;
        const track = this.currentSection.tracks[trackIndex];

        switch (this.selection.type) {
            case 'steps':
                const stepIndex = Math.min(...this.selection.stepIndices);
                return this.getStepFlatPosition(track.pattern, stepIndex);

            case 'subdivision':
            case 'subdivision-steps':
                return this.getSubdivisionFlatPosition(track.pattern, this.selection.subdivisionPath);

            case 'track':
                return 0; // Start at beginning of track
        }

        return null;
    }

    getStepFlatPosition(pattern, stepIndex) {
        let position = 0;

        for (let i = 0; i < stepIndex && i < pattern.length; i++) {
            const step = pattern[i];
            if (step.subdivide) {
                position += this.getFlatStepCount(step.pattern);
            } else {
                position += 1;
            }
        }

        return position;
    }

    getSubdivisionFlatPosition(pattern, subdivisionPath) {
        if (!subdivisionPath || subdivisionPath.length === 0) return 0;

        let position = 0;
        let currentPattern = pattern;

        for (let pathIndex = 0; pathIndex < subdivisionPath.length; pathIndex++) {
            const stepIndex = subdivisionPath[pathIndex];

            // Add positions for steps before this one
            for (let i = 0; i < stepIndex && i < currentPattern.length; i++) {
                const step = currentPattern[i];
                if (step.subdivide) {
                    position += this.getFlatStepCount(step.pattern);
                } else {
                    position += 1;
                }
            }

            // If this is not the last element in the path, go deeper
            if (pathIndex < subdivisionPath.length - 1) {
                const currentStep = currentPattern[stepIndex];
                if (currentStep && currentStep.subdivide) {
                    currentPattern = currentStep.pattern;
                }
            }
        }

        return position;
    }

    getFlatStepCount(pattern) {
        let count = 0;

        for (const step of pattern) {
            if (step.subdivide) {
                count += this.getFlatStepCount(step.pattern);
            } else {
                count += 1;
            }
        }

        return count;
    }

    getFlatPositionSelection(trackIndex, flatPosition) {
        const track = this.currentSection.tracks[trackIndex];
        const result = this.findStepAtFlatPosition(track.pattern, flatPosition, []);

        if (!result) return null;

        if (result.subdivisionPath.length === 0) {
            // Regular step
            return {
                type: 'steps',
                trackIndex: trackIndex,
                stepIndices: new Set([result.stepIndex]),
                subdivisionPath: null
            };
        } else {
            // Subdivision step
            return {
                type: 'subdivision',
                trackIndex: trackIndex,
                stepIndices: new Set([result.subdivisionPath[0]]),
                subdivisionPath: result.subdivisionPath
            };
        }
    }

    findStepAtFlatPosition(pattern, targetPosition, currentPath) {
        let position = 0;

        for (let i = 0; i < pattern.length; i++) {
            const step = pattern[i];

            if (step.subdivide) {
                const subdivisionStepCount = this.getFlatStepCount(step.pattern);

                if (position + subdivisionStepCount > targetPosition) {
                    // Target is within this subdivision
                    const relativePosition = targetPosition - position;
                    const result = this.findStepAtFlatPosition(step.pattern, relativePosition, [...currentPath, i]);
                    if (result) {
                        return result;
                    }
                }

                position += subdivisionStepCount;
            } else {
                if (position === targetPosition) {
                    // Found the target step
                    if (currentPath.length === 0) {
                        return { stepIndex: i, subdivisionPath: [] };
                    } else {
                        return { stepIndex: currentPath[0], subdivisionPath: [...currentPath, i] };
                    }
                }
                position += 1;
            }
        }

        return null;
    }

    moveStepsSelection(direction) {
        // This method is now handled by the unified moveSelection above
        // Keeping for backward compatibility but not used
    }

    moveSubdivisionSelection(direction) {
        // This method is now handled by the unified moveSelection above
        // Keeping for backward compatibility but not used
    }

    moveSubdivisionStepsSelection(direction) {
        // This method is now handled by the unified moveSelection above
        // Keeping for backward compatibility but not used
    }

    moveTrackSelection(direction) {
        const currentTrackIndex = this.selection.trackIndex;
        const newTrackIndex = currentTrackIndex + direction;

        // Check bounds
        if (newTrackIndex < 0 || newTrackIndex >= this.currentSection.tracks.length) {
            return;
        }

        this.clearSelection();
        this.selectTrack(newTrackIndex);
    }

    clearStepProperties() {
        switch (this.selection.type) {
            case 'track':
                // Clear all step properties in the entire track recursively
                this.clearTrackPropertiesRecursive(this.selection.trackIndex);
                this.selectionChanged = true;
                break;

            case 'steps':
                // Clear properties from selected steps
                this.selection.stepIndices.forEach(stepIndex => {
                    const step = this.currentSection.tracks[this.selection.trackIndex].pattern[stepIndex];
                    if (step && step.type === 'step') {
                        this.clearStepCustomProperties(step);
                        this.selectionChanged = true;
                    }
                });
                break;

            case 'subdivision':
                // Remove the entire subdivision and replace with regular steps
                this.removeSelectedSubdivision();
                this.selectionChanged = true;
                break;

            case 'subdivision-steps':
                // Clear properties from selected subdivision steps
                if (this.selection.subdivisionPath && this.selection.subdivisionPath.length >= 2) {
                    const pathWithoutSet = this.selection.subdivisionPath.slice(0, -1);
                    const selectedSubSteps = this.selection.subdivisionPath[this.selection.subdivisionPath.length - 1];
                    const subdivision = this.navigateToSubdivision(this.selection.trackIndex, pathWithoutSet);

                    if (subdivision && subdivision.pattern) {
                        selectedSubSteps.forEach(subIndex => {
                            const subStep = subdivision.pattern[subIndex];
                            if (subStep && subStep.type === 'step') {
                                this.clearStepCustomProperties(subStep);
                                this.selectionChanged = true;
                            }
                        });
                    }
                }
                break;
        }

        if (this.selectionChanged) {
            this.clearSelection();
            this.player.updateTrackStates();
            this.render("clearStepProperties");
            this.updateContextMenu();
        }
    }

    removeSelectedSubdivision() {
        if (this.selection.type !== 'subdivision' || !this.selection.subdivisionPath) {
            return;
        }

        const subdivisionPath = this.selection.subdivisionPath;

        if (subdivisionPath.length === 1) {
            // Main subdivision - replace with regular steps
            const [stepIndex] = subdivisionPath;
            this.breakMainSubdivision(this.selection.trackIndex, stepIndex);
        } else {
            // Nested subdivision - remove nested level
            const [stepIndex, ...path] = subdivisionPath;
            this.breakNestedSubdivision(this.selection.trackIndex, stepIndex, path);
        }
    }

    clearStepCustomProperties(step) {
        // Remove all custom properties, keeping only type and fire
        const keepProperties = ['type', 'fire'];
        const currentProperties = Object.keys(step);

        currentProperties.forEach(prop => {
            if (!keepProperties.includes(prop)) {
                delete step[prop];
            }
        });
    }

    clearTrackPropertiesRecursive(trackIndex) {
        const track = this.currentSection.tracks[trackIndex];
        this.clearPatternPropertiesRecursive(track.pattern);
    }

    clearPatternPropertiesRecursive(pattern) {
        pattern.forEach(step => {
            if (step.type === 'step') {
                this.clearStepCustomProperties(step);
            } else if (step.subdivide && step.pattern) {
                this.clearPatternPropertiesRecursive(step.pattern);
            }
        });
    }

    breakSubdivision() {
        if (this.selection.type === 'subdivision' && this.selection.subdivisionPath) {
            const subdivisionPath = this.selection.subdivisionPath;

            if (subdivisionPath.length === 1) {
                const [stepIndex] = subdivisionPath;
                this.breakMainSubdivision(this.selection.trackIndex, stepIndex);
            } else {
                const [stepIndex, ...path] = subdivisionPath;
                this.breakNestedSubdivision(this.selection.trackIndex, stepIndex, path);
            }
        } else if (this.selection.type === 'subdivision-steps' && this.selection.subdivisionPath) {
            const pathWithoutSet = this.selection.subdivisionPath.slice(0, -1);

            if (pathWithoutSet.length === 1) {
                const [stepIndex] = pathWithoutSet;
                this.breakMainSubdivision(this.selection.trackIndex, stepIndex);
            } else {
                const [stepIndex, ...path] = pathWithoutSet;
                this.breakNestedSubdivision(this.selection.trackIndex, stepIndex, path);
            }
        }

        this.clearSelection();
        this.selectionChanged = true;
        this.player.updateTrackStates();
        this.render("breakSubdivision");
    }

    breakMainSubdivision(trackIndex, stepIndex) {
        const track = this.currentSection.tracks[trackIndex];
        const subdivision = track.pattern[stepIndex];

        if (!subdivision.subdivide) return;

        const hasActiveSteps = this.hasActiveStepsInPattern(subdivision.pattern);
        const span = subdivision.span || 1;

        const replacementSteps = new Array(span).fill(null).map(() => ({ type: "step", fire: 0 }));
        if (hasActiveSteps) {
            replacementSteps[0].fire = 1;
        }

        track.pattern.splice(stepIndex, 1, ...replacementSteps);
    }

    breakNestedSubdivision(trackIndex, stepIndex, subdivisionPath) {
        const parentPath = [stepIndex, ...subdivisionPath.slice(0, -1)];
        const parentSubdivision = this.navigateToSubdivision(trackIndex, parentPath);

        if (!parentSubdivision || !parentSubdivision.pattern) return;

        const subIndexToBreak = subdivisionPath[subdivisionPath.length - 1];
        const subToBreak = parentSubdivision.pattern[subIndexToBreak];

        if (subToBreak && subToBreak.subdivide) {
            const hasActive = this.hasActiveStepsInPattern(subToBreak.pattern);
            parentSubdivision.pattern[subIndexToBreak] = { type: "step", fire: hasActive ? 1 : 0 };
        }
    }

    hasActiveStepsInPattern(pattern) {
        return pattern.some(step => {
            if (step.type === 'step' && step.fire === 1) {
                return true;
            } else if (step.subdivide && step.pattern) {
                return this.hasActiveStepsInPattern(step.pattern);
            }
            return false;
        });
    }

    showSubdivisionControls() {
        $('subdivision-controls').style.display = 'flex';
    }

    hideSubdivisionControls() {
        $('subdivision-controls').style.display = 'none';
    }

    createSubdivision() {
        const subdivisionCount = parseInt($('subdivision-type').value);

        if (this.selection.type === 'steps' && this.selection.stepIndices.size > 0) {
            this.createRegularSubdivision(subdivisionCount);
        } else if ((this.selection.type === 'subdivision-steps' || this.selection.type === 'subdivision') && this.selection.subdivisionPath) {
            this.createNestedSubdivision(subdivisionCount);
        }

        this.hideSubdivisionControls();
        this.clearSelection();
        this.render("createSubdivision");
    }

    createRegularSubdivision(subdivisionCount) {
        const stepIndices = Array.from(this.selection.stepIndices).sort((a, b) => a - b);
        const track = this.currentSection.tracks[this.selection.trackIndex];

        const subdivision = {
            subdivide: subdivisionCount,
            span: stepIndices.length,
            pattern: Array.from({ length: subdivisionCount }, () => ({ type: "step", fire: 0 }))
        };

        track.pattern[stepIndices[0]] = subdivision;

        for (let i = stepIndices.length - 1; i >= 1; i--) {
            track.pattern.splice(stepIndices[i], 1);
        }
    }

    createNestedSubdivision(subdivisionCount) {
        if (this.selection.type === 'subdivision-steps') {
            const pathWithoutSet = this.selection.subdivisionPath.slice(0, -1);
            const selectedSubSteps = this.selection.subdivisionPath[this.selection.subdivisionPath.length - 1];

            const subdivision = this.navigateToSubdivision(this.selection.trackIndex, pathWithoutSet);
            if (!subdivision || !subdivision.pattern) return;

            const selectedIndices = Array.from(selectedSubSteps).sort((a, b) => a - b);

            const nestedSubdivision = {
                subdivide: subdivisionCount,
                span: selectedIndices.length,
                pattern: Array.from({ length: subdivisionCount }, () => ({ type: "step", fire: 0 }))
            };

            subdivision.pattern[selectedIndices[0]] = nestedSubdivision;

            for (let i = selectedIndices.length - 1; i >= 1; i--) {
                subdivision.pattern.splice(selectedIndices[i], 1);
            }
        } else if (this.selection.type === 'subdivision') {
            const subdivision = this.navigateToSubdivision(this.selection.trackIndex, this.selection.subdivisionPath);
            if (!subdivision || !subdivision.pattern) return;

            const nestedSubdivision = {
                subdivide: subdivisionCount,
                span: subdivision.pattern.length,
                pattern: Array.from({ length: subdivisionCount }, () => ({ type: "step", fire: 0 }))
            };

            subdivision.pattern = [nestedSubdivision];
            subdivision.subdivide = 1;
        }
    }

    render(from="default") {
        // For debugging:
        // console.log("Render:", from);

        this.calculateMaxSteps();

        // Update melody mode class based on current tab
        const activeTab = document.querySelector('.context-tab.active');
        if (activeTab && activeTab.getAttribute('data-tab') === 'melody') {
            document.body.classList.add('melody-mode');
        } else {
            document.body.classList.remove('melody-mode');
        }

        // Render section tabs
        const sectionTabsContainer = document.getElementById('section-tabs-container') ||
            this.container.parentElement.querySelector('#section-tabs-container');
        if (sectionTabsContainer) {
            sectionTabsContainer.innerHTML = this.createSectionTabs();
            this.attachSectionTabListeners();
        }

        // Render main sequencer content
        const template = this.createTemplate();
        this.container.innerHTML = template;
        this.attachTrackControlButtonListeners();
    }

    calculateMaxSteps() {
        this.maxSteps = Math.max(...this.currentSection.tracks.map(track => this.getTrackDisplayLength(track)));
        this.player.maxSteps = this.maxSteps; // Update player with new max steps   
    }

    getTrackDisplayLength(track) {
        return this.calculatePatternLength(track.pattern);
    }

    calculatePatternLength(pattern) {
        return pattern.reduce((length, step) => {
            if (step.subdivide) {
                return length + (step.span || 1);
            }
            return length + 1;
        }, 0);
    }

    createTemplate() {
        const indexRow = this.createIndexRow();
        const trackRows = this.currentSection.tracks.map((track, index) => this.createTrackRow(track, index)).join('');
        const shadowTrack = this.createShadowTrackRow();

        return `
                    ${indexRow}
                    <div class="track-container">
                        ${trackRows}
                        ${shadowTrack}
                    </div>
                `;
    }

    createIndexRow() {
        const indexSteps = Array.from({ length: this.maxSteps }, (_, i) =>
            `<div class="index-step" id="index-${i}">${i + 1}</div>`
        ).join('');

        return `
                    <div class="index-row">
                        <div class="index-header"></div>
                        <div class="index-steps">${indexSteps}</div>
                    </div>
                `;
    }

    createShadowTrackRow() {
        return `
                    <div class="shadow-track-row" id="shadow-track">
                        <div class="shadow-track-header">
                            <div class="shadow-track-text">+ Add Track</div>
                        </div>
                        <div class="shadow-track-steps"></div>
                    </div>
                `;
    }

    createTrackRow(track, trackIndex) {
        const header = this.createTrackHeader(track, trackIndex);
        const steps = this.createTrackSteps(track, trackIndex);
        const classes = [
            'track-row',
            track.layout?.minimized ? 'minimized' : ''
        ].filter(Boolean).join(' ');

        return `
                    <div class="${classes}">
                        ${header}
                        <div class="steps-container">
                            ${steps}
                        </div>
                    </div>
                `;
    }

    createTrackHeader(track, trackIndex) {
        const isSelected = this.selection.type === 'track' && this.selection.trackIndex === trackIndex;
        const isMinimized = track.layout?.minimized;
        const isMuted = track.playback?.muted || false;

        if (isMinimized) {
            return `
        <div class="track-header ${isSelected ? 'selected' : ''}" id="header-${trackIndex}">
            <button class="minimize-button" id="minimize-${trackIndex}">▼</button>
            <button class="remove-button" id="remove-${trackIndex}">×</button>
            <div style="font-weight: bold; font-size: 10px; margin: 0;">${track.name}</div>
        </div>
    `;
        } else {
            return `
        <div class="track-header ${isSelected ? 'selected' : ''}" id="header-${trackIndex}">
            <button class="minimize-button" id="minimize-${trackIndex}">▲</button>
            <button class="remove-button" id="remove-${trackIndex}">×</button>
            
            <div class="track-controls">
                <div class="track-control-row">
                    <span class="track-control-label">Note:</span>
                    <span style="color: #fff; font-size: 10px;">${track.defaults.note}</span>
                    <span class="track-control-label">Ch:</span>
                    <span style="color: #fff; font-size: 10px;">${track.defaults.channel}</span>
                </div>
                
                <div class="track-control-row">
                    <input type="text" 
                        class="track-name-input-small" 
                        value="${track.name}" 
                        data-track="${trackIndex}"
                        onclick="event.stopPropagation()">
                    
                    <label style="display: flex; align-items: center; gap: 3px; cursor: pointer;">
                        <input type="checkbox" 
                            class="track-control-checkbox track-mute-checkbox" 
                            ${isMuted ? 'checked' : ''}
                            data-track="${trackIndex}"
                            onclick="event.stopPropagation()">
                        <span class="track-control-label">Mute</span>
                    </label>
                </div>
                
                <div class="track-control-row">
                    <span class="track-control-label">Length:</span>
                    <div class="track-control-with-buttons">
                        <button class="track-control-button track-length-decrease" data-track="${trackIndex}" onclick="event.stopPropagation()"><</button>
                        <input type="number" 
                            class="track-control-input track-length-input" 
                            value="${track.pattern.length}" 
                            min="1" 
                            max="32"
                            data-track="${trackIndex}"
                            onclick="event.stopPropagation()">
                        <button class="track-control-button track-length-increase" data-track="${trackIndex}" onclick="event.stopPropagation()">></button>
                    </div>
                </div>
                
                <div class="track-control-row">
                    <span class="track-control-label">Pulses:</span>
                    <div class="track-control-with-buttons">
                        <button class="track-control-button track-pulses-decrease" data-track="${trackIndex}" onclick="event.stopPropagation()"><</button>
                        <input type="number" 
                            class="track-control-input track-euclidean-pulses-input" 
                            value="${track.operations?.euclidean?.pulses || 0}" 
                            min="0" 
                            max="${track.pattern.length}"
                            data-track="${trackIndex}"
                            onclick="event.stopPropagation()">
                        <button class="track-control-button track-pulses-increase" data-track="${trackIndex}" onclick="event.stopPropagation()">></button>
                    </div>
                </div>
                
                <div class="track-control-row">
                    <span class="track-control-label">Rotate:</span>
                    <div class="track-control-with-buttons">
                        <button class="track-control-button track-rotate-decrease" data-track="${trackIndex}"><</button>
                        <input type="number" 
                            class="track-control-input track-rotate-input" 
                            value="${track.defaults?.rotate || 1}" 
                            min="1" 
                            max="32"
                            data-track="${trackIndex}"
                            onclick="event.stopPropagation()">
                        <button class="track-control-button track-rotate-increase" data-track="${trackIndex}">></button>
                    </div>
                </div>
            </div>
        </div>
    `;
        }
    }

createTrackSteps(track, trackIndex) {
        // Show different velocity modes based on track state
        const isMinimized = track.layout?.minimized;
        const showMelodyMode = this.isCurrentTabMelody() && !isMinimized;
        const showRhythmVelocityFill = this.isCurrentTabRhythm() && !isMinimized;
        const showRhythmVelocityBg = this.isCurrentTabRhythm() && isMinimized;

        let steps = '';

        for (let i = 0; i < track.pattern.length; i++) {
            const step = track.pattern[i];

            if (step.subdivide) {
                const span = step.span || 1;
                const subdivisionContent = this.createSubdivisionHTML(step, trackIndex, i);

                steps += `<div class="step" id="step-${trackIndex}-${i}" style="flex: ${span}; position: relative;">${subdivisionContent}</div>`;
            } else {
                const isActive = step.fire === 1;
                const hasProps = this.stepHasCustomProps(step, track.defaults);
                const hasPitch = showMelodyMode && this.stepHasPitch(step, track);
                const hasVelocityFill = showRhythmVelocityFill && this.stepHasVelocity(step, track);
                const hasVelocityBg = showRhythmVelocityBg && this.stepHasVelocity(step, track);
                const isSelected = this.selection.type === 'steps' &&
                    this.selection.trackIndex === trackIndex &&
                    this.selection.stepIndices.has(i);

                const classes = ['step'];
                if (isActive && !hasPitch && !hasVelocityFill && !hasVelocityBg) classes.push('active');
                if (hasProps) classes.push('has-props');
                if (hasPitch) classes.push('has-pitch');
                if (hasVelocityFill) classes.push('has-velocity');
                if (hasVelocityBg) classes.push('has-velocity-bg');
                if (isSelected) classes.push('selected');

                // Calculate visualization heights for inline style
                let visualStyle = 'style="flex: 1; position: relative;';

                if (hasPitch) {
                    const pitchHeight = this.getPitchHeight(step, track);
                    if (pitchHeight !== null) {
                        visualStyle += ` --pitch-height: ${pitchHeight}%;`;
                    }
                }

                if (hasVelocityFill) {
                    const velocityHeight = this.getVelocityHeight(step, track);
                    if (velocityHeight !== null) {
                        visualStyle += ` --velocity-height: ${velocityHeight}%;`;
                        // console.log(`Setting velocity height for step ${i}:`, velocityHeight);
                    }
                }

                visualStyle += '"';

                // Add props indicator
                const propsIndicator = hasProps ? '<div class="props-indicator"></div>' : '';

                steps += `<div class="${classes.join(' ')}" id="step-${trackIndex}-${i}" ${visualStyle}>${propsIndicator}</div>`;
            }
        }

        return steps;
    }

    stepHasCustomProps(step, defaults) {
        return (step.velocity && step.velocity !== 100) ||
            (step.note && step.note !== defaults.note) ||
            (step.channel && step.channel !== defaults.channel) ||
            step.mod ||
            step.odds ||
            step.scale;
    }

    createSubdivisionHTML(subdivision, trackIndex, stepPath, level = 0) {
        if (!subdivision.pattern || !Array.isArray(subdivision.pattern)) {
            subdivision.pattern = new Array(subdivision.subdivide || 2).fill(null).map(() => ({ type: "step", fire: 0 }));
        }

        const pathParts = typeof stepPath === 'string' ? stepPath.split('-').map(p => parseInt(p)) : [stepPath];
        const track = this.currentSection.tracks[trackIndex];
        const isMinimized = track.layout?.minimized;
        const showMelodyMode = this.isCurrentTabMelody() && !isMinimized;
        const showRhythmVelocityFill = this.isCurrentTabRhythm() && !isMinimized; // Fill bars only for maximized
        const showRhythmVelocityBg = this.isCurrentTabRhythm() && isMinimized; // Background color for minimized

        const isSubdivisionContainerSelected = this.selection.type === 'subdivision' &&
            this.selection.trackIndex === trackIndex &&
            this.selection.subdivisionPath &&
            this.arraysEqual(this.selection.subdivisionPath, pathParts);

        const subdivisionSteps = subdivision.pattern.map((subStep, subIndex) => {
            const currentPath = [...pathParts, subIndex];
            const currentPathStr = currentPath.join('-');

            if (subStep.subdivide) {
                const nestedContent = this.createSubdivisionHTML(subStep, trackIndex, currentPathStr, level + 1);
                const nestedSpan = subStep.span || 1;
                const isSelected = (this.selection.type === 'subdivision' &&
                    this.selection.trackIndex === trackIndex &&
                    this.selection.subdivisionPath &&
                    this.arraysEqual(this.selection.subdivisionPath, currentPath)) ||
                    (this.selection.type === 'subdivision-steps' &&
                        this.selection.trackIndex === trackIndex &&
                        this.selection.subdivisionPath &&
                        this.selection.subdivisionPath.length >= 2 &&
                        this.arraysEqual(this.selection.subdivisionPath.slice(0, -1), pathParts) &&
                        this.selection.subdivisionPath[this.selection.subdivisionPath.length - 1] &&
                        this.selection.subdivisionPath[this.selection.subdivisionPath.length - 1].has(subIndex));

                const classes = ['subdivision-step'];
                if (isSelected) classes.push('selected');

                return `<div class="${classes.join(' ')}" id="step-${trackIndex}-${currentPathStr}" style="flex: ${nestedSpan}; position: relative;">${nestedContent}</div>`;
            } else {
                const isActive = subStep.fire === 1;
                const hasProps = this.stepHasCustomProps(subStep, track.defaults);
                const hasPitch = showMelodyMode && this.stepHasPitch(subStep, track);
                const hasVelocityFill = showRhythmVelocityFill && this.stepHasVelocity(subStep, track);
                const hasVelocityBg = showRhythmVelocityBg && this.stepHasVelocity(subStep, track);
                const isSelected = (this.selection.type === 'subdivision' &&
                    this.selection.trackIndex === trackIndex &&
                    this.selection.subdivisionPath &&
                    this.arraysEqual(this.selection.subdivisionPath, currentPath)) ||
                    (this.selection.type === 'subdivision-steps' &&
                        this.selection.trackIndex === trackIndex &&
                        this.selection.subdivisionPath &&
                        this.selection.subdivisionPath.length >= 2 &&
                        this.arraysEqual(this.selection.subdivisionPath.slice(0, -1), pathParts) &&
                        this.selection.subdivisionPath[this.selection.subdivisionPath.length - 1] &&
                        this.selection.subdivisionPath[this.selection.subdivisionPath.length - 1].has(subIndex));

                const classes = ['subdivision-step'];
                if (isActive && !hasPitch && !hasVelocityFill && !hasVelocityBg) classes.push('active');
                if (hasProps) classes.push('has-props');
                if (hasPitch) classes.push('has-pitch');
                if (hasVelocityFill) classes.push('has-velocity');
                if (hasVelocityBg) classes.push('has-velocity-bg');
                if (isSelected) classes.push('selected');

                // Calculate visualization heights for subdivision steps
                let visualStyle = 'style="flex: 1; position: relative;';

                if (hasPitch) {
                    const pitchHeight = this.getPitchHeight(subStep, track);
                    if (pitchHeight !== null) {
                        visualStyle += ` --pitch-height: ${pitchHeight}%;`;
                    }
                }

                if (hasVelocityFill) {
                    const velocityHeight = this.getVelocityHeight(subStep, track);
                    if (velocityHeight !== null) {
                        visualStyle += ` --velocity-height: ${velocityHeight}%;`;
                    }
                }

                visualStyle += '"';

                // Add props indicator
                const propsIndicator = hasProps ? '<div class="props-indicator"></div>' : '';

                return `<div class="${classes.join(' ')}" id="step-${trackIndex}-${currentPathStr}" ${visualStyle}>${propsIndicator}</div>`;
            }
        }).join('');

        const subdivisionClasses = ['subdivision'];
        if (isSubdivisionContainerSelected) {
            subdivisionClasses.push('subdivision-selected');
        }

        // Add subdivision label with proper positioning
        const labelText = `${subdivision.span || 1}/${subdivision.subdivide}`;

        return `
        <div class="${subdivisionClasses.join(' ')}" style="position: relative;">
            ${subdivisionSteps}
            <div class="subdivision-label">${labelText}</div>
        </div>
    `;
    }

    showJsonModal() {
        const jsonText = $('json-text');

        // Export the complete data structure with all sections
        const completeData = {
            sections: this.data  // Export all sections
        };

        const formattedJson = this.formatJson(completeData);

        // Store raw JSON for copying
        this.currentExportData = formattedJson;

        jsonText.innerHTML = this.highlightJson(formattedJson);
        $('json-modal').classList.add('show');
    }

    // Copy JSON data to clipboard
    async copyJsonData() {
        const copyButton = $('json-copy');

        if (!this.currentExportData) {
            copyButton.textContent = 'Error';
            setTimeout(() => {
                copyButton.textContent = 'Copy';
            }, 1000);
            return;
        }

        try {
            // Use the Clipboard API
            await navigator.clipboard.writeText(this.currentExportData);

            // Show success feedback
            copyButton.textContent = 'Copied!';
            copyButton.style.background = '#469';

            // Reset button after 1 second
            setTimeout(() => {
                copyButton.textContent = 'Copy';
                copyButton.style.background = '#567';
            }, 1000);


        } catch (error) {

            copyButton.textContent = 'Failed';
            copyButton.style.background = '#c42';

            // Reset button after 1 second
            setTimeout(() => {
                copyButton.textContent = 'Copy';
                copyButton.style.background = '#567';
            }, 1000);

            console.error('Copy failed:', error);

        }
    }

    hideJsonModal() {
        $('json-modal').classList.remove('show');
    }

    formatJson(obj) {
        return JSON.stringify(obj, null, 2);
    }

    highlightJson(jsonString) {
        return jsonString
            .replace(/("[\w\s]*")(\s*:)/g, '<span class="json-key">$1</span><span class="json-punctuation">$2</span>')
            .replace(/: (".*?")/g, ': <span class="json-string">$1</span>')
            .replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
            .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
            .replace(/: (null)/g, ': <span class="json-null">$1</span>')
            .replace(/([{}[\],])/g, '<span class="json-punctuation">$1</span>');
    }


    showImportModal() {
        $('import-modal').classList.add('show');
        $('import-textarea').value = '';
        $('import-status').textContent = '';
    }

    // Hide import modal
    hideImportModal() {
        $('import-modal').classList.remove('show');
    }

    // Import JSON data or ASCII notation
   importData() {
        const textarea = $('import-textarea');
        const statusDiv = $('import-status');
        const inputText = textarea.value.trim();

        if (!inputText) {
            statusDiv.textContent = 'Please paste JSON data or ASCII notation first.';
            statusDiv.style.color = '#f66';
            return;
        }

        let newSection = false;

        try {
            let importedData;

            // Try to detect if this is ASCII notation or JSON
            if (this.isASCIINotation(inputText)) {
                newSection = true;
                // Parse as ASCII notation
                importedData = this.asciiParser.parseASCII(inputText);
                statusDiv.textContent = 'Detected ASCII notation format...';
                statusDiv.style.color = '#fa8';
            } else {
                // Parse as JSON
                importedData = JSON.parse(inputText);

                // Validate the structure
                if (!importedData.sections || !Array.isArray(importedData.sections)) {
                    throw new Error('Invalid format: missing sections array');
                }

                // Validate each section has required properties
                for (let i = 0; i < importedData.sections.length; i++) {
                    const section = importedData.sections[i];
                    if (!section.name || !section.tracks || !Array.isArray(section.tracks)) {
                        throw new Error(`Invalid section ${i}: missing name or tracks`);
                    }
                }
            }

            // Stop playback if running
            if (this.player.isPlaying) {
                this.player.stop();
                $('play-button').textContent = 'Play';
                $('follow-button').style.display = 'none';
            }

            if(newSection) {
                this.currentSectionIndex = this.data.length - 1;
                this.data.push(importedData.sections[0]);
            } else {
                // Update the data
                this.data = importedData.sections;
                this.player.sections = importedData.sections;

                // Reset to first section
                this.currentSectionIndex = 0;
                this.currentSection = this.data[0];
                this.player.currentSectionIndex = 0;
                this.player.currentSection = this.data[0];
                this.player.playingSectionIndex = 0;
            }


            

            // Clear selection and reset following
            this.clearSelection();
            this.isFollowingPlayback = true;

            // Update player track states and UI
            this.player.updateTrackStates();
            this.render("importJsonData");
            this.updateContextMenu();

            // Update tempo input
            const tempoInput = $('tempo');
            if (tempoInput) {
                tempoInput.value = this.currentSection.bpm || 120;
            }

            // Show success message
            const trackCount = importedData.sections.reduce((count, section) => count + section.tracks.length, 0);
            statusDiv.textContent = `Successfully imported ${importedData.sections.length} sections with ${trackCount} tracks!`;
            statusDiv.style.color = '#8f8';

            // Close modal after short delay
            setTimeout(() => {
                this.hideImportModal();
            }, 1500);

        } catch (error) {
            // Show error message
            statusDiv.textContent = `Import failed: ${error.message}`;
            statusDiv.style.color = '#f66';
            console.error('Import error:', error);
        }
    }

    // Check if text looks like ASCII notation
    isASCIINotation(text) {
        // Look for pattern: WORD: followed by x, -, numbers, or similar characters
        const asciiPattern = /^[A-Z0-9_]{1,10}\s*:\s*[x\-\._oOX0-9\s]+$/m;
        return asciiPattern.test(text);
    }

    // Export current section to ASCII notation
    exportToASCII(options = {}) {
        return this.asciiParser.exportToASCII({
            sections: [this.currentSection]
        }, {
            sectionIndex: 0,
            ...options
        });
    }

    // Clear import textarea
    clearImportData() {
        $('import-textarea').value = '';
        $('import-status').textContent = '';
    }


}

