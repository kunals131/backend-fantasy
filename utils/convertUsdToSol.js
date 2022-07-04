const axios = require('axios')
const   BigNumber = require("bignumber.js");


const convertUsdToSol=  async(usd)=>{
    const givenUsd = new BigNumber(usd);
    const result = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const solToUsd = new BigNumber(result.data.solana.usd);
    const solPerUsd = new BigNumber(1).dividedBy(solToUsd);
    // console.log(solPerUsd);
    let SOL = new BigNumber(0);
    SOL = SOL.plus(givenUsd).multipliedBy(solPerUsd);

    return SOL.dp(3).toString();
}

module.exports = convertUsdToSol;