// js/config/initialConfig.js
export const INITIAL_STATE = {
    player: {
        capital: 1000000,
        netWorth: 1000000,
        companies: []
    },
    economy: {
        inflation: 5.0,
        interestRate: 7.5,
        taxRate: 20,
        globalDemand: 85
    },
    round: 1
};

export default INITIAL_STATE;