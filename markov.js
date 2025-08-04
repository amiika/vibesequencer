class MarkovMatrix {
    constructor(number, mm=null, init=false, size=null) {
        this.number = number;
        this.size = size;
        this.currentIndex = null;
        this.matrix = this.toMatrix(number, mm, init, size);
        this.randomizer = null;
    }

    setRandomizer(randomizer) {
        this.randomizer = randomizer;
    }

    nextRandom() {
        if(this.randomizer) {
            return this.randomizer.next();
        } else {
            return Math.random();   
        }
    }

     normalize = (mm) => {
            for (let row = 0; row < mm.length; row++) {
                let pp = 0.0;
                
                // Sum up probabilities in the row
                mm[row].forEach(p => {
                    pp += p;
                });
                
                // Normalize each element in the row
                for (let i = 0; i < mm[row].length; i++) {
                    if (pp === 0.0) {
                        mm[row][i] = 1.0 / mm[row].length;
                    } else {
                        mm[row][i] /= pp;
                    }
                }
            }
            
            return mm;
        }

    toMatrix(i, mm = null, init = false, length = 0) {
        
        if (typeof mm === 'number') {
            length = mm;
        } else if (Array.isArray(mm)) {
            length = mm.length;
        }

        let degrees = i.toString().split("").map(d => {
            return parseInt(d, 36);
        });

        if(!length) length = Math.max(...degrees);

        if (!Array.isArray(mm)) {
            mm = Array.from({ length }, () => 
                Array.from({ length }, () => init ? (1.0 / length) : 0.0)
            );
        }

        degrees.forEach((d, index) => {
            d = (d === 0 ? length - 1 : d - 1); // 0 = length makes more sense
            const row = d % length; // Treat int as 'ring': 12 = 1->2->1
            const nextD = degrees[(index + 1) % degrees.length];
            const nextDAdjusted = (nextD === 0 ? length - 1 : nextD - 1);
            const column = nextDAdjusted % length;
            mm[row][column] += 1.0;
        });

        this.currentIndex = degrees[0];

        console.log("SETTING", this.currentIndex);
        
        // Normalize the resulted matrix
        return this.normalize(mm);
    }

    toString() {
        if (!this.matrix || this.matrix.length === 0) {
            return "[]";
        }
        
        const rows = this.matrix.length;
        const cols = this.matrix[0].length;
        
        // Find the maximum width needed for formatting
        let maxWidth = 0;
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const formatted = this.matrix[i][j].toFixed(3);
                maxWidth = Math.max(maxWidth, formatted.length);
            }
        }
        
        let result = "[\n";
        for (let i = 0; i < rows; i++) {
            result += "  [";
            for (let j = 0; j < cols; j++) {
                const formatted = this.matrix[i][j].toFixed(3);
                result += formatted.padStart(maxWidth);
                if (j < cols - 1) result += ", ";
            }
            result += "]";
            if (i < rows - 1) result += ",";
            result += "\n";
        }
        result += "]";
        
        return result;
        }

        next(mm = this.matrix) {
            const r = this.nextRandom();
            console.log("RANDOM: ", r);
            let pp = 0;
            console.log("INDEX?", this.currentIndex);

            const i = mm[this.currentIndex].findIndex(p => {
                pp += p;
                
                return pp > r;
            });
            this.currentIndex = i;
            return i;
        }

        nextNote(octave, scale = 4095) {
            
            const note = noteFromPitchOctaveScale(this.next(), octave, scale);
            console.log("Vibe note", note);
            return note;
        }

    }