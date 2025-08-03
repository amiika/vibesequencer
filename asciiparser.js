
class ASCIINotationParser {
    constructor() {
        // GM (General MIDI) standard drum mapping on channel 10
        this.defaultMidiMappings = {
            // Requested specific shorthands
            'BD': { note: 36, channel: 10 },   // Bass Drum (C2)
            'SN': { note: 38, channel: 10 },   // Snare (D2)
            'LT': { note: 45, channel: 10 },   // Low Tom (A2)
            'MT': { note: 47, channel: 10 },   // Medium Tom (B2)
            'HT': { note: 50, channel: 10 },   // High Tom (D3)
            'CL': { note: 39, channel: 10 },   // Hand Clap (D#2)
            'SH': { note: 70, channel: 10 },   // Shaker/Maracas (A#4)
            'RS': { note: 37, channel: 10 },   // Rimshot/Side Stick (C#2)
            'CB': { note: 56, channel: 10 },   // Cowbell (G#3)
            'CY': { note: 49, channel: 10 },   // Cymbal/Crash (C#3)
            'OH': { note: 46, channel: 10 },   // Open High Hat (A#2)
            'CH': { note: 42, channel: 10 },   // Closed High Hat (F#2)
            
            // Additional common aliases
            'KICK': { note: 36, channel: 10 }, // Kick Drum
            'KD': { note: 36, channel: 10 },   // Kick Drum
            'SNARE': { note: 38, channel: 10 }, // Snare
            'HH': { note: 42, channel: 10 },   // Hi-Hat (same as CH)
            'CLAP': { note: 39, channel: 10 },  // Hand Clap (same as CL)
            'SHAKER': { note: 70, channel: 10 }, // Shaker (same as SH)
            'RIMSHOT': { note: 37, channel: 10 }, // Rimshot (same as RS)
            'COWBELL': { note: 56, channel: 10 }, // Cowbell (same as CB)
            'CRASH': { note: 49, channel: 10 },  // Crash (same as CY)
            
            // Extended drum sounds
            'SD': { note: 40, channel: 10 },   // Electric Snare (E2)
            'ESNARE': { note: 40, channel: 10 }, // Electric Snare
            'STICK': { note: 37, channel: 10 }, // Side Stick (same as RS)
            'SIDE': { note: 37, channel: 10 },  // Side Stick
            'FT': { note: 41, channel: 10 },    // Low Floor Tom (F2)
            'PH': { note: 44, channel: 10 },    // Pedal Hi-Hat (G#2)
            'HMT': { note: 48, channel: 10 },   // Hi-Mid Tom (C3)
            
            // Additional cymbals
            'CRASH1': { note: 49, channel: 10 }, // Crash Cymbal 1 (C#3)
            'RIDE1': { note: 51, channel: 10 },  // Ride Cymbal 1 (D#3)
            'RIDE': { note: 51, channel: 10 },   // Ride Cymbal 1
            'CHINA': { note: 52, channel: 10 },  // Chinese Cymbal (E3)
            'BELL': { note: 53, channel: 10 },   // Ride Bell (F3)
            'SPLASH': { note: 55, channel: 10 }, // Splash Cymbal (G3)
            'CRASH2': { note: 57, channel: 10 }, // Crash Cymbal 2 (A3)
            'RIDE2': { note: 59, channel: 10 },  // Ride Cymbal 2 (B3)
            
            // Additional percussion
            'TAMB': { note: 54, channel: 10 },   // Tambourine (F#3)
            'VIBES': { note: 58, channel: 10 },  // Vibraslap (A#3)
            'BONGO1': { note: 60, channel: 10 }, // Hi Bongo (C4)
            'BONGO2': { note: 61, channel: 10 }, // Low Bongo (C#4)
            'CONGA1': { note: 62, channel: 10 }, // Mute Hi Conga (D4)
            'CONGA2': { note: 63, channel: 10 }, // Open Hi Conga (D#4)
            'CONGA3': { note: 64, channel: 10 }, // Low Conga (E4)
            'TIMBALE1': { note: 65, channel: 10 }, // High Timbale (F4)
            'TIMBALE2': { note: 66, channel: 10 }, // Low Timbale (F#4)
            'AGOGO1': { note: 67, channel: 10 }, // High Agogo (G4)
            'AGOGO2': { note: 68, channel: 10 }, // Low Agogo (G#4)
            'CABASA': { note: 69, channel: 10 }, // Cabasa (A4)
            'MARACAS': { note: 70, channel: 10 }, // Maracas (A#4) - same as SH
            'WHISTLE1': { note: 71, channel: 10 }, // Short Whistle (B4)
            'WHISTLE2': { note: 72, channel: 10 }, // Long Whistle (C5)
            'GUIRO1': { note: 73, channel: 10 }, // Short Guiro (C#5)
            'GUIRO2': { note: 74, channel: 10 }, // Long Guiro (D5)
            'CLAVES': { note: 75, channel: 10 }, // Claves (D#5)
            'WOOD1': { note: 76, channel: 10 },  // Hi Wood Block (E5)
            'WOOD2': { note: 77, channel: 10 },  // Low Wood Block (F5)
            'CUICA1': { note: 78, channel: 10 }, // Mute Cuica (F#5)
            'CUICA2': { note: 79, channel: 10 }, // Open Cuica (G5)
            'TRIANGLE1': { note: 80, channel: 10 }, // Mute Triangle (G#5)
            'TRIANGLE2': { note: 81, channel: 10 }, // Open Triangle (A5)
            
            // 808 style variations
            '808': { note: 36, channel: 10 },    // 808 Kick (same as BD)
            'TRAP': { note: 38, channel: 10 },   // Trap Snare
            'SNAP': { note: 39, channel: 10 },   // Finger Snap (Hand Clap)
            
            // Melodic instruments (different channels)
            'BASS': { note: 40, channel: 1 },    // Bass synth
            'LEAD': { note: 60, channel: 1 },    // Lead synth  
            'PAD': { note: 72, channel: 2 },     // Pad
            'PLUCK': { note: 48, channel: 3 },   // Pluck synth
            'CHORD': { note: 64, channel: 4 },   // Chord stab
        };
    }

    // Main method to parse ASCII notation text into sequencer JSON format
    parseASCII(asciiText, options = {}) {
        let {
            sectionName = "ASCII Import",
            bpm = 120,
            repeat = 1,
            defaultVelocity = 100,
            customMappings = {}
        } = options;

        // Combine default and custom MIDI mappings
        const midiMappings = { ...this.defaultMidiMappings, ...customMappings };

        // Split into lines and filter out empty lines and comments
        const lines = asciiText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && line.includes(':') && !line.startsWith('//'));

        if (lines.length === 0) {
            throw new Error('No valid track lines found. Expected format: "TRACK: x - x - x"');
        }

        const tracks = [];
        
        for (const line of lines) {
            try {
                const track = this.parseTrackLine(line, midiMappings, defaultVelocity);
                if (track && track.title) {
                    sectionName = track.title;
                } else {
                   tracks.push(track);
                }
            } catch (error) {
                throw new Error(`Error parsing line "${line}": ${error.message}`);
            }
        }

        // Create the complete sequencer data structure
        return {
            sections: [{
                name: sectionName,
                bpm: bpm,
                repeat: repeat,
                tracks: tracks
            }]
        };
    }

    // Parse a single track line
    parseTrackLine(line, midiMappings, defaultVelocity) {
        // Split on colon to separate track name from pattern
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) {
            colonIndex = line.indexOf('|');
            if (colonIndex === -1) {
                throw new Error('Missing colon separator');
            }
        }

        const trackName = line.substring(0, colonIndex).trim().toUpperCase();
        const patternText = line.substring(colonIndex + 1).trim();

        if(trackName === 'TITLE' || trackName === 'TITLE:') {
            return {title: patternText};
        }

        // Split pattern into individual steps
        const stepChars = patternText.split(/\s+/).filter(char => char.length > 0);
        
        if (stepChars.length === 0) {
            throw new Error('No pattern steps found');
        }

        // Get MIDI mapping for this track
        const midiMapping = midiMappings[trackName] || { note: 36, channel: 10 };

        // Create pattern array
        const pattern = stepChars.map(char => {
            return this.parseStepCharacter(char, defaultVelocity);
        });

        // Create track object
        return {
            name: this.formatTrackName(trackName),
            defaults: {
                note: midiMapping.note,
                channel: midiMapping.channel,
                velocity: defaultVelocity
            },
            playback: { muted: false },
            pattern: pattern,
            operations: { 
                euclidean: { 
                    steps: pattern.length, 
                    pulses: pattern.filter(step => step.fire === 1).length 
                }, 
                rotate: 0 
            },
            layout: { minimized: false, selected: false }
        };
    }

    // Parse individual step characters with extended notation
    parseStepCharacter(char, defaultVelocity) {
        // Basic fire/rest notation
        if (char === 'x' || char === 'X' || char === '*') {
            return { type: "step", fire: 1 };
        }
        if (char === '-' || char === '.' || char === '_') {
            return { type: "step", fire: 0 };
        }

        // Velocity notation: numbers 1-9 represent different velocities
        if (/^[1-9]$/.test(char)) {
            const velocity = this.mapNumberToVelocity(parseInt(char));
            return { type: "step", fire: 1, velocity: velocity };
        }

        // Accent notation
        if (char === '#') {
            return { type: "step", fire: 1, velocity: 127 };
        }

        // Ghost note notation
        if (char === 'o' || char === 'O') {
            return { type: "step", fire: 1, velocity: 60 };
        }

        // Default to rest for unknown characters
        return { type: "step", fire: 0 };
    }

    // Map numbers 1-9 to velocity values
    mapNumberToVelocity(number) {
        // Map 1-9 to velocity range 40-127
        return Math.round(40 + (number - 1) * (127 - 40) / 8);
    }

    // Format track names nicely
    formatTrackName(name) {
        const nameMap = {
            // Requested specific shorthands
            'BD': 'Bass Drum',
            'SN': 'Snare',
            'LT': 'Low Tom',
            'MT': 'Medium Tom',
            'HT': 'High Tom',
            'CL': 'Hand Clap',
            'SH': 'Shaker',
            'RS': 'Rimshot',
            'CB': 'Cowbell',
            'CY': 'Cymbal',
            'OH': 'Open High Hat',
            'CH': 'Closed High Hat',
            
            // Additional common aliases
            'KICK': 'Kick',
            'KD': 'Kick Drum', 
            'SNARE': 'Snare',
            'HH': 'Hi-Hat',
            'CLAP': 'Hand Clap',
            'SHAKER': 'Shaker',
            'RIMSHOT': 'Rimshot',
            'COWBELL': 'Cowbell',
            'CRASH': 'Crash',
            
            // Extended drums
            'SD': 'Electric Snare',
            'ESNARE': 'Electric Snare',
            'STICK': 'Side Stick',
            'SIDE': 'Side Stick',
            'FT': 'Floor Tom',
            'PH': 'Pedal Hat',
            'HMT': 'Hi-Mid Tom',
            
            // Cymbals
            'CRASH1': 'Crash 1',
            'RIDE1': 'Ride 1',
            'RIDE': 'Ride',
            'CHINA': 'China',
            'BELL': 'Ride Bell',
            'SPLASH': 'Splash',
            'CRASH2': 'Crash 2',
            'RIDE2': 'Ride 2',
            
            // Percussion
            'TAMB': 'Tambourine',
            'VIBES': 'Vibraslap',
            'BONGO1': 'Hi Bongo',
            'BONGO2': 'Low Bongo',
            'CONGA1': 'Mute Conga',
            'CONGA2': 'Open Conga',
            'CONGA3': 'Low Conga',
            'TIMBALE1': 'Hi Timbale',
            'TIMBALE2': 'Low Timbale',
            'AGOGO1': 'Hi Agogo',
            'AGOGO2': 'Low Agogo',
            'CABASA': 'Cabasa',
            'MARACAS': 'Maracas',
            'WHISTLE1': 'Short Whistle',
            'WHISTLE2': 'Long Whistle',
            'GUIRO1': 'Short Guiro',
            'GUIRO2': 'Long Guiro',
            'CLAVES': 'Claves',
            'WOOD1': 'Hi Wood Block',
            'WOOD2': 'Low Wood Block',
            'CUICA1': 'Mute Cuica',
            'CUICA2': 'Open Cuica',
            'TRIANGLE1': 'Mute Triangle',
            'TRIANGLE2': 'Open Triangle',
            
            // Modern variations
            '808': '808 Kick',
            'TRAP': 'Trap Snare',
            'SNAP': 'Finger Snap',
            
            // Melodic
            'BASS': 'Bass',
            'LEAD': 'Lead',
            'PAD': 'Pad',
            'PLUCK': 'Pluck',
            'CHORD': 'Chord'
        };

        return nameMap[name] || name.charAt(0) + name.slice(1).toLowerCase();
    }

    // Check if text looks like ASCII notation
    isASCIINotation(text) {
        // Look for pattern: WORD: followed by x, -, numbers, or similar characters
        const asciiPattern = /^[A-Z0-9_]{1,10}\s*:\s*[x\-\._oOX0-9\s]+$/m;
        return asciiPattern.test(text);
    }

}

