const BigNumber = require('bignumber.js');
const convertUsdToSol = require('./convertUsdToSol');

const calculatePrizeAmount = async (prizeAmount,sections,rank,totalParticipants)=>{
    let prize = new BigNumber(prizeAmount);

    let baseRank = 0;
    for(let section of sections) {
        let sectionPrize = new BigNumber(section.prize);
        let divison100 = new BigNumber(100);
        let totalPrizeMoney = prize.multipliedBy(sectionPrize).dividedBy(divison100);
        let totalCandidates = Math.ceil(totalParticipants*section.percentage/100);
        let participantbig = new BigNumber(totalCandidates);
        let onePrize = totalPrizeMoney.dividedBy(participantbig);
        // console.log(onePrize.toString(), 'One Prize');
        // console.log(totalCandidates.toString(), 'Total Participants');
        // console.log(totalPrizeMoney.toString(), 'Total Prize Money');
        // console.log(rank, 'Rank');
        // console.log(baseRank+totalCandidates, 'base rank+total');
        if (rank>baseRank && rank<=(baseRank+totalCandidates)) {
            let finalPrize = await convertUsdToSol(onePrize.toString());
            return finalPrize;
        }
        baseRank+=totalCandidates;
    }
    return 0;
}

module.exports =calculatePrizeAmount;