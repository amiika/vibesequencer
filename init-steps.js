// Updated init-steps.js with Kick, Hats, and Bass tracks on 16 steps

const sequencerData = {
    "sections": [
        {
            "name": "Section 1",
            "bpm": 120,
            "repeat": 1,   
            "tracks": [
                {
                    "name": "Kick",
                    "defaults": {
                        "note": 36,
                        "channel": 10,
                        "velocity": 100
                    },
                    "playback": {
                        "muted": false
                    },
                    "pattern": [
                        { "type": "step", "fire": 1, "velocity": 110 },  // Beat 1
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 1, "velocity": 90 },   // Beat 2
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 1, "velocity": 105 },  // Beat 3
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 1, "velocity": 95 },   // Beat 4
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 0 }
                    ],
                    "operations": {
                        "euclidean": {
                            "steps": 16,
                            "pulses": 4
                        },
                        "rotate": 0
                    },
                    "layout": {
                        "selected": false,
                        "minimized": false
                    }
                },
                {
                    "name": "Hats",
                    "defaults": {
                        "note": 42,
                        "channel": 10,
                        "velocity": 80
                    },
                    "playback": {
                        "muted": false
                    },
                    "pattern": [
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 1, "velocity": 70 },   // Off-beat
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 1, "velocity": 75 },   // Off-beat
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 1, "velocity": 85 },   // Off-beat
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 1, "velocity": 80 },   // Off-beat
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 1, "velocity": 70 },   // Off-beat
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 1, "velocity": 75 },   // Off-beat
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 1, "velocity": 90 },   // Accent
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 1, "velocity": 65 }    // Soft ending
                    ],
                    "operations": {
                        "euclidean": {
                            "steps": 16,
                            "pulses": 8
                        },
                        "rotate": 0
                    },
                    "layout": {
                        "selected": false,
                        "minimized": true
                    }
                },
                {
                    "name": "Bass",
                    "defaults": {
                        "note": 40,
                        "channel": 1,
                        "velocity": 100
                    },
                    "playback": {
                        "muted": false
                    },
                    "pattern": [
                        { "type": "step", "fire": 1, "note": 40, "velocity": 110 },  // Root note
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 1, "note": 40, "velocity": 80 },   // Root repeat
                        { "type": "step", "fire": 1, "note": 47, "velocity": 90 },   // Fifth
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 1, "note": 45, "velocity": 85 },   // Fourth
                        { "type": "step", "fire": 1, "note": 40, "velocity": 105 },  // Root
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 1, "note": 42, "velocity": 75 },   // Second
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 1, "note": 47, "velocity": 95 },   // Fifth
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 0 },
                        { "type": "step", "fire": 1, "note": 35, "velocity": 100 }   // Lower root
                    ],
                    "operations": {
                        "euclidean": {
                            "steps": 16,
                            "pulses": 7
                        },
                        "rotate": 0
                    },
                    "layout": {
                        "selected": false,
                        "minimized": true
                    }
                }
            ]
        }
    ]
};