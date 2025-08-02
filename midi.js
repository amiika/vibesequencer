class MIDIManager {
    constructor() {
        this.midiAccess = null;
        this.outputPort = null;
        this.isAvailable = false;
        this.activeNotes = new Map();
        this.hasShownWarning = false; // Track if warning was already shown
        this.init();
    }

    async init() {
        // Check if WebMIDI is supported
        if (!navigator.requestMIDIAccess) {
            this.showWebMIDIWarning();
            this.updateStatus('WebMIDI not supported in this browser');
            return;
        }

        try {
            this.midiAccess = await navigator.requestMIDIAccess();
            this.isAvailable = true;
            this.updateStatus();
            this.setupEventListeners();
            this.populateOutputPorts();

            // Listen for port changes
            this.midiAccess.addEventListener('statechange', () => {
                this.populateOutputPorts();
                this.updateStatus();
            });
        } catch (error) {
            console.error('MIDI initialization failed:', error);
            this.updateStatus('MIDI access denied or failed');
        }
    }

    showWebMIDIWarning() {
        if (this.hasShownWarning) return;
        
        this.hasShownWarning = true;
        const modal = document.getElementById('webmidi-warning-modal');
        if (modal) {
            modal.classList.add('show');
            
            // Setup close button
            const closeButton = document.getElementById('webmidi-warning-close');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    this.hideWebMIDIWarning();
                });
            }

            // Close on outside click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideWebMIDIWarning();
                }
            });

            // Close on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.hideWebMIDIWarning();
                }
            });
        }
    }

    hideWebMIDIWarning() {
        const modal = document.getElementById('webmidi-warning-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    setupEventListeners() {
        document.getElementById('midi-output-select').addEventListener('change', (e) => {
            this.setOutputPort(e.target.value);
        });

        document.getElementById('refresh-midi').addEventListener('click', () => {
            this.populateOutputPorts();
        });

        document.getElementById('test-midi').addEventListener('click', () => {
            this.sendTestNote();
        });
    }

    populateOutputPorts() {
        const select = document.getElementById('midi-output-select');
        select.innerHTML = '';

        if (!this.midiAccess) {
            select.innerHTML = '<option value="">MIDI not available</option>';
            return;
        }

        const outputs = Array.from(this.midiAccess.outputs.values());

        if (outputs.length === 0) {
            select.innerHTML = '<option value="">No MIDI outputs available</option>';
        } else {
            select.innerHTML = '<option value="">Select MIDI output...</option>';
            outputs.forEach(output => {
                const option = document.createElement('option');
                option.value = output.id;
                option.textContent = output.name || `MIDI Output ${output.id}`;
                select.appendChild(option);
            });

            // Automatically select the first output if available
            if (outputs.length > 0) {
                const firstOutput = outputs[0];
                select.value = firstOutput.id;
                this.setOutputPort(firstOutput.id);
            }
        }
    }

    setOutputPort(portId) {
        if (!this.midiAccess || !portId) {
            this.outputPort = null;
            this.updateStatus();
            return;
        }

        this.outputPort = this.midiAccess.outputs.get(portId);
        this.updateStatus();

        if (this.outputPort) {
            console.log('MIDI output set to:', this.outputPort.name);
        }
    }

    updateStatus(customMessage = null) {
        const statusElement = document.getElementById('midi-status');

        if (customMessage) {
            statusElement.textContent = customMessage;
            statusElement.className = 'midi-status unavailable';
        } else if (!this.isAvailable) {
            statusElement.textContent = 'MIDI not available';
            statusElement.className = 'midi-status unavailable';
        } else if (this.outputPort) {
            statusElement.textContent = `Connected to: ${this.outputPort.name}`;
            statusElement.className = 'midi-status connected';
        } else {
            statusElement.textContent = 'MIDI available - select output port';
            statusElement.className = 'midi-status disconnected';
        }
    }

    sendNoteOn(note, velocity = 100, channel = 0) {
        if (!this.outputPort) {
            console.warn('No MIDI output port selected');
            return;
        }

        // Ensure we're within MIDI range
        note = Math.max(0, Math.min(127, note));
        velocity = Math.max(1, Math.min(127, velocity));
        channel = Math.max(0, Math.min(15, channel));

        const noteOnMessage = [0x90 + channel, note, velocity];

        try {
            this.outputPort.send(noteOnMessage);

            // Track active note for proper note-off
            const noteKey = `${channel}-${note}`;
            this.activeNotes.set(noteKey, { note, channel, timestamp: Date.now() });

          //  console.log(`MIDI Note On: Ch${channel + 1} Note${note} Vel${velocity}`);
        } catch (error) {
            console.error('Failed to send MIDI note on:', error);
        }
    }

    sendNoteOff(note, channel = 0) {
        if (!this.outputPort) {
            return;
        }

        note = Math.max(0, Math.min(127, note));
        channel = Math.max(0, Math.min(15, channel));

        const noteOffMessage = [0x80 + channel, note, 0];

        try {
            this.outputPort.send(noteOffMessage);

            // Remove from active notes
            const noteKey = `${channel}-${note}`;
            this.activeNotes.delete(noteKey);

            //console.log(`MIDI Note Off: Ch${channel + 1} Note${note}`);
        } catch (error) {
            console.error('Failed to send MIDI note off:', error);
        }
    }

    sendTestNote() {
        const testNote = parseInt(document.getElementById('test-note').value) || 60;
        const testChannel = parseInt(document.getElementById('test-channel').value) || 0;

        if (!this.outputPort) {
            alert('Please select a MIDI output port first');
            return;
        }

        // Send note on
        this.sendNoteOn(testNote, 100, testChannel);

        // Send note off after 500ms
        setTimeout(() => {
            this.sendNoteOff(testNote, testChannel);
        }, 500);
    }

    // Stop all active notes (panic function)
    allNotesOff() {
        if (!this.outputPort) return;

        // Send note off for all tracked active notes
        this.activeNotes.forEach((noteInfo, noteKey) => {
            this.sendNoteOff(noteInfo.note, noteInfo.channel);
        });

        // Send All Notes Off CC message on all channels
        for (let channel = 0; channel < 16; channel++) {
            try {
                this.outputPort.send([0xB0 + channel, 123, 0]); // All Notes Off
            } catch (error) {
                console.error('Failed to send All Notes Off:', error);
            }
        }

        this.activeNotes.clear();
        console.log('All MIDI notes turned off');
    }
}
