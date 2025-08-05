// Updated init-steps.js with Kick, Hats, and Bass tracks on 16 steps

const sequencerData = {
  "sections": [
    {
      "name": "Section 1",
      "bpm": 120,
      "repeat": 2,
      "tracks": [
        {
          "name": "Closed High Hat",
          "defaults": {
            "note": 42,
            "channel": 10,
            "velocity": 100,
            "odds": 0.9
          },
          "playback": {
            "muted": false
          },
          "pattern": [
            {
              "type": "step",
              "fire": 0,
              "velocity": 34
            },
            {
              "type": "step",
              "fire": 0,
              "pitch": 4,
              "octave": 3,
              "note": 40
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0,
              "pitch": 8,
              "octave": 3,
              "note": 44
            }
          ],
          "operations": {
            "euclidean": {
              "steps": 16,
              "pulses": 4
            },
            "rotate": 0
          },
          "layout": {
            "minimized": false,
            "selected": false
          }
        },
        {
          "name": "Open High Hat",
          "defaults": {
            "note": 46,
            "channel": 10,
            "velocity": 100
          },
          "playback": {
            "muted": false
          },
          "pattern": [
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.34375,
              "velocity": 59
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "subdivide": 6,
              "span": 3,
              "pattern": [
                {
                  "type": "step",
                  "fire": 0
                },
                {
                  "type": "step",
                  "fire": 1,
                  "velocity": 49
                },
                {
                  "type": "step",
                  "fire": 0
                },
                {
                  "type": "step",
                  "fire": 1
                }
              ]
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            }
          ],
          "operations": {
            "euclidean": {
              "steps": 16,
              "pulses": 2
            },
            "rotate": 0
          },
          "layout": {
            "minimized": false,
            "selected": false
          }
        },
        {
          "name": "Electric Snare",
          "defaults": {
            "note": 40,
            "channel": 10,
            "velocity": 100
          },
          "playback": {
            "muted": false
          },
          "pattern": [
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "velocity": 54
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            }
          ],
          "operations": {
            "euclidean": {
              "steps": 16,
              "pulses": 2
            },
            "rotate": 0
          },
          "layout": {
            "minimized": false,
            "selected": false
          }
        },
        {
          "name": "Bass Drum",
          "defaults": {
            "note": 36,
            "channel": 10,
            "velocity": 100
          },
          "playback": {
            "muted": false
          },
          "pattern": [
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "pitch": 4,
              "octave": 3,
              "note": 40,
              "idealTime": 0.15625,
              "velocity": 37
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "pitch": 4,
              "octave": 3,
              "note": 40,
              "idealTime": 0.40625
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "pitch": 6,
              "octave": 3,
              "note": 42,
              "idealTime": 0.65625
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0,
              "pitch": 3,
              "octave": 3,
              "note": 39,
              "idealTime": 0.90625
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.96875
            }
          ],
          "operations": {
            "euclidean": {
              "steps": 16,
              "pulses": 5
            },
            "rotate": 0
          },
          "layout": {
            "minimized": false,
            "selected": false
          }
        }
      ]
    },
    {
      "name": "Section 2",
      "bpm": 120,
      "repeat": 2,
      "tracks": [
        {
          "name": "Closed High Hat",
          "defaults": {
            "note": 42,
            "channel": 10,
            "velocity": 100
          },
          "playback": {
            "muted": false
          },
          "pattern": [
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "velocity": 53
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            }
          ],
          "operations": {
            "euclidean": {
              "steps": 16,
              "pulses": 4
            },
            "rotate": 0
          },
          "layout": {
            "minimized": false,
            "selected": false
          }
        },
        {
          "name": "Open High Hat",
          "defaults": {
            "note": 46,
            "channel": 10,
            "velocity": 100
          },
          "playback": {
            "muted": false
          },
          "pattern": [
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.09375,
              "velocity": 93
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "subdivide": 8,
              "span": 3,
              "pattern": [
                {
                  "type": "step",
                  "fire": 0
                },
                {
                  "type": "step",
                  "fire": 0
                },
                {
                  "type": "step",
                  "fire": 1,
                  "velocity": 52
                },
                {
                  "type": "step",
                  "fire": 0
                },
                {
                  "subdivide": 2,
                  "span": 3,
                  "pattern": [
                    {
                      "type": "step",
                      "fire": 0
                    },
                    {
                      "type": "step",
                      "fire": 1,
                      "velocity": 82
                    }
                  ]
                },
                {
                  "type": "step",
                  "fire": 0
                }
              ]
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            }
          ],
          "operations": {
            "euclidean": {
              "steps": 16,
              "pulses": 1
            },
            "rotate": 0
          },
          "layout": {
            "minimized": false,
            "selected": false
          }
        },
        {
          "name": "Medium Tom",
          "defaults": {
            "note": 47,
            "channel": 10,
            "velocity": 100,
            "mod": 2
          },
          "playback": {
            "muted": false
          },
          "pattern": [
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "velocity": 41
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.96875
            }
          ],
          "operations": {
            "euclidean": {
              "steps": 16,
              "pulses": 1
            },
            "rotate": 0
          },
          "layout": {
            "minimized": false,
            "selected": false
          }
        },
        {
          "name": "Electric Snare",
          "defaults": {
            "note": 40,
            "channel": 10,
            "velocity": 100
          },
          "playback": {
            "muted": false
          },
          "pattern": [
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.21875
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.78125
            },
            {
              "type": "step",
              "fire": 0,
              "idealTime": 0.84375
            },
            {
              "type": "step",
              "fire": 0
            }
          ],
          "operations": {
            "euclidean": {
              "steps": 16,
              "pulses": 3
            },
            "rotate": 0
          },
          "layout": {
            "minimized": false,
            "selected": false
          }
        },
        {
          "name": "Bass Drum",
          "defaults": {
            "note": 36,
            "channel": 10,
            "velocity": 100
          },
          "playback": {
            "muted": false
          },
          "pattern": [
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            }
          ],
          "operations": {
            "euclidean": {
              "steps": 16,
              "pulses": 7
            },
            "rotate": 0
          },
          "layout": {
            "minimized": false,
            "selected": false
          }
        }
      ]
    },
    {
      "name": "Section 3",
      "bpm": 120,
      "repeat": 2,
      "tracks": [
        {
          "name": "Closed High Hat",
          "defaults": {
            "note": 42,
            "channel": 10,
            "velocity": 100,
            "odds": 0.5
          },
          "playback": {
            "muted": false
          },
          "pattern": [
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            }
          ],
          "operations": {
            "euclidean": {
              "steps": 16,
              "pulses": 7
            },
            "rotate": 0
          },
          "layout": {
            "minimized": false,
            "selected": false
          }
        },
        {
          "name": "High Tom",
          "defaults": {
            "note": 50,
            "channel": 10,
            "velocity": 100
          },
          "playback": {
            "muted": false
          },
          "pattern": [
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.17857142857142855
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.8928571428571426
            }
          ],
          "operations": {
            "euclidean": {
              "steps": 16,
              "pulses": 1
            },
            "rotate": 0
          },
          "layout": {
            "minimized": false,
            "selected": false
          }
        },
        {
          "name": "Electric Snare",
          "defaults": {
            "note": 40,
            "channel": 10,
            "velocity": 100
          },
          "playback": {
            "muted": false
          },
          "pattern": [
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            }
          ],
          "operations": {
            "euclidean": {
              "steps": 16,
              "pulses": 7
            },
            "rotate": 0
          },
          "layout": {
            "minimized": false,
            "selected": false
          }
        },
        {
          "name": "Bass Drum",
          "defaults": {
            "note": 36,
            "channel": 10,
            "velocity": 100
          },
          "playback": {
            "muted": false
          },
          "pattern": [
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            }
          ],
          "operations": {
            "euclidean": {
              "steps": 16,
              "pulses": 4
            },
            "rotate": 0
          },
          "layout": {
            "minimized": false,
            "selected": false
          }
        }
      ]
    },
    {
      "name": "Section 4",
      "bpm": 120,
      "repeat": 2,
      "tracks": [
        {
          "name": "Closed High Hat",
          "defaults": {
            "note": 42,
            "channel": 10,
            "velocity": 100
          },
          "playback": {
            "muted": false
          },
          "pattern": [
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.038461538461538464
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.2692307692307693
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "velocity": 73,
              "idealTime": 0.576923076923077
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.6538461538461539
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.8076923076923076
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            }
          ],
          "operations": {
            "euclidean": {
              "steps": 16,
              "pulses": 5
            },
            "rotate": 0
          },
          "layout": {
            "minimized": false,
            "selected": true
          }
        },
        {
          "name": "Open High Hat",
          "defaults": {
            "note": 46,
            "channel": 10,
            "velocity": 100
          },
          "playback": {
            "muted": false
          },
          "pattern": [
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.34375,
              "velocity": 57
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.46875
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            }
          ],
          "operations": {
            "euclidean": {
              "steps": 16,
              "pulses": 2
            },
            "rotate": 0
          },
          "layout": {
            "minimized": false,
            "selected": false
          }
        },
        {
          "name": "Electric Snare",
          "defaults": {
            "note": 40,
            "channel": 10,
            "velocity": 100,
            "mod": 2
          },
          "playback": {
            "muted": false
          },
          "pattern": [
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.15625,
              "velocity": 57
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.40625
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.53125,
              "velocity": 51
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.71875
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.84375
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            }
          ],
          "operations": {
            "euclidean": {
              "steps": 16,
              "pulses": 5
            },
            "rotate": 0
          },
          "layout": {
            "minimized": false,
            "selected": false
          }
        },
        {
          "name": "Bass Drum",
          "defaults": {
            "note": 36,
            "channel": 10,
            "velocity": 100
          },
          "playback": {
            "muted": false
          },
          "pattern": [
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.03125
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.34375
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.46875
            },
            {
              "type": "step",
              "fire": 0,
              "idealTime": 0.59375
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            }
          ],
          "operations": {
            "euclidean": {
              "steps": 16,
              "pulses": 4
            },
            "rotate": 0
          },
          "layout": {
            "minimized": false,
            "selected": false
          }
        }
      ]
    },
    {
      "name": "Section 5",
      "bpm": 120,
      "repeat": 2,
      "tracks": [
        {
          "name": "Closed High Hat",
          "defaults": {
            "note": 42,
            "channel": 10,
            "velocity": 100
          },
          "playback": {
            "muted": false
          },
          "pattern": [
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            }
          ],
          "operations": {
            "euclidean": {
              "steps": 16,
              "pulses": 6
            },
            "rotate": 0
          },
          "layout": {
            "minimized": false,
            "selected": false
          }
        },
        {
          "name": "Open High Hat",
          "defaults": {
            "note": 46,
            "channel": 10,
            "velocity": 100
          },
          "playback": {
            "muted": false
          },
          "pattern": [
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.21875
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.78125
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            }
          ],
          "operations": {
            "euclidean": {
              "steps": 16,
              "pulses": 2
            },
            "rotate": 0
          },
          "layout": {
            "minimized": false,
            "selected": false
          }
        },
        {
          "name": "Electric Snare",
          "defaults": {
            "note": 40,
            "channel": 10,
            "velocity": 100
          },
          "playback": {
            "muted": false
          },
          "pattern": [
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0,
              "idealTime": 0.46875
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.59375
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.90625
            }
          ],
          "operations": {
            "euclidean": {
              "steps": 16,
              "pulses": 3
            },
            "rotate": 0
          },
          "layout": {
            "minimized": false,
            "selected": false
          }
        },
        {
          "name": "Bass Drum",
          "defaults": {
            "note": 36,
            "channel": 10,
            "velocity": 100
          },
          "playback": {
            "muted": false
          },
          "pattern": [
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 1,
              "idealTime": 0.28125
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "subdivision",
              "span": 1,
              "pattern": [
                {
                  "type": "step",
                  "fire": 1,
                  "idealTime": 0.71875
                },
                {
                  "type": "step",
                  "fire": 1,
                  "idealTime": 0.78125
                }
              ],
              "subdivide": 2
            },
            {
              "type": "step",
              "fire": 0
            },
            {
              "type": "step",
              "fire": 0
            }
          ],
          "operations": {
            "euclidean": {
              "steps": 16,
              "pulses": 3
            },
            "rotate": 0
          },
          "layout": {
            "minimized": false,
            "selected": false
          }
        }
      ]
    }
  ]
};