const noteFromPitchOctaveScale = (pitch, octave, scale = 4095) => {
    console.log("NOTE DROM:", pitch, octave, scale);
    const scaleNotes = numberToScale(scale);
    const pitchInScale = scaleNotes[pitch % scaleNotes.length];
    return (octave * 12) + pitchInScale;
}


const pitchFromNoteAndScale = (note, octave, scale = 4095) => {
    // Get the pitch class (0-11) from the note
    const pitchClass = note % 12;

    // Get the scale notes
    const scaleNotes = numberToScale(scale);

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


const numberToScale = (number = 4095) => {
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

const pitchFromNote = (note) => {
    return note % 12;
}

const octaveFromNote = (note) => {
    return Math.floor(note / 12);
}