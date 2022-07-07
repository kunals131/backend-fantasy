const moment = require('moment');

const checkTournamentState = (startTime,endTime)=>{
    let state = '';
    const diff1 = moment().diff(moment(startTime), 'seconds');
    const diff2 = moment(endTime).diff(moment());
    if (diff1<0) {
        return 'open';
    }
    if (diff1>0) state = 'in_progress'
    if (diff2<0) state = 'closed';
    return state;
}

module.exports = {checkTournamentState}