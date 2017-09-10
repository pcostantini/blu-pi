module.exports = {
    mpsToKph: (mps) => Math.round(mps * 3.6 * 100) / 100,
    isValidGpsEvent: (s) => !!s.value && s.value.point && s.value.point[0] !== null && s.name === 'Gps'
};
