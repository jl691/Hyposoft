function checkUppercaseLetter(letter){
    if(letter.length > 1){
        return false;
    }
    if(letter.charCodeAt(0) < 65 || letter.charCodeAt(0) > 90){
        return false;
    }
    return true;
}

function checkNumber(number){
    return Number.isInteger(number);
}

function checkLetterOrder(first, second){
    if(first.charCodeAt(0) > second.charCodeAt(0)){
        return false;
    }
    return true;
}

function checkNumberOrder(first, second) {
    if(parseInt(first) > parseInt(second)){
        return false;
    }
    return true;
}

function checkPositive(number){
    if(number < 0){
        return false;
    }
    return true;
}

export {checkLetterOrder, checkNumber, checkNumberOrder, checkPositive, checkUppercaseLetter}