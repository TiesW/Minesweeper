//General game configuration:

    // Not zero-indexed
    var fieldWidth, fieldHeight, mineAmount;

    var level = localStorage.choice;
    var levelPicker = document.getElementById('pickLevel');

    if(level == "easy"){
        levelPicker.value = level;
        mineAmount = 10;
        fieldWidth = 10;
        fieldHeight = 8;
    }
    if(level == "medium" || level == undefined){ //Makes medium the default level.
        levelPicker.value = "medium";
        mineAmount = 30;
        fieldWidth = 14;
        fieldHeight = 12;
    }
    if(level == "hard"){
        levelPicker.value = level;
        mineAmount = 80;
        fieldWidth = 26;
        fieldHeight = 22;
    }

//----------------------------------

if (mineAmount > fieldWidth * fieldHeight) {
    throw new Error("Too many mines.");
}

//Dynamically creating a two-dimensional array that represent the field, based on the fieldHeight and fieldWidth variables:
var field = Array.from({ length: fieldHeight }, row => Array.from({ length: fieldWidth }, () => 0));


window.onload = function() {
    createField();
};

var amountOfSquares = fieldHeight * fieldWidth;

var gameOver = false;
var firstMove = true;

var playAgainBtn = document.querySelector('#play-again-btn');
var gameField = document.querySelector('#field');

playAgainBtn.addEventListener('click', () => location.reload());
gameField.addEventListener('click', clickSquare);
gameField.addEventListener('keydown', keyboardInput );

function changeLevel() {
    //Using localStorage to store the selected level:
    var levelPicker = document.getElementById('pickLevel');
    localStorage.choice = levelPicker.value;
    location.reload();
}


function clickSquare(e) {
    if (e.target.tagName !== 'BUTTON') return;

    var targetCell = e.target.parentElement;
    var targetRow = targetCell.parentElement;
    var targetRowCells = [...targetRow.children];
    var gameFieldRowsEls = [...document.querySelectorAll('#field tr')];

    var y_pos = gameFieldRowsEls.indexOf(targetRow);
    var x_pos = targetRowCells.indexOf(targetCell);

    if (firstMove){ //On the first move, the square should be opened immediately, since there would be no reason to flag it.
        openASquare(y_pos, x_pos);
        firstMove = false;
        return;
    }
    
    //Unselecting all squares when the field is clicked (again):
    var bttn = gameField.getElementsByTagName("button");
    for (i = 0; i < amountOfSquares; i++) {
        if(bttn[i].style.backgroundColor == "lightgray"){
            if(e.target.style.backgroundColor == "lightgray"){
                bttn[i].style.backgroundColor = "white";
                //If the clicked square is already selected, it must first be kept gray so that it can be detected as being selected, before being able to be unselected:
                e.target.style.backgroundColor = "lightgray";
            } else {
                bttn[i].style.backgroundColor = "white";
            }
        }
        if(bttn[i].style.opacity == "0.5"){
            if(e.target.style.opacity == "0.5"){
                bttn[i].style.opacity = "1";
                e.target.style.opacity = "0.5";
            } else {
                bttn[i].style.opacity = "1";
            }
        }
    }

    //For selected flagged squares, I chose to change the opacity since changing the 'filter' property would mess with the squares' different values of brightness if the flagged square is opened.
        // Changing the backgroundColor property was also not ideal since the flagged squares backgroundColor required '!important' to work.
    if(e.target.classList.contains("flagMine") || e.target.classList.contains("flagClear")){ //'classList.contains' instead of 'className ==', because in the case of 'flagMine', the full classname is 'mine flagMine'.
        if(e.target.style.opacity == "0.5"){
            e.target.style.opacity = "1";
            if(document.getElementById("open") != null){
                document.getElementById("open").remove();
            }
            if(document.getElementById("removeFlag") != null){
                document.getElementById("removeFlag").remove();
            }
            return;
        } else {
            e.target.style.opacity = "0.5";
        }
    }

    if(e.target.style.backgroundColor == "lightgray" && !e.target.classList.contains("flagMine") && !e.target.classList.contains("flagClear")){
        //Unselect square if it is clicked when already selected:
        e.target.style.backgroundColor = "white";
        if(document.getElementById("open") != null){
            document.getElementById("open").remove();
        }
        if(document.getElementById("flag") != null){
            document.getElementById("flag").remove();
        }
        return;
    } else {
        e.target.style.backgroundColor = "lightgray";
    }

    //Creating 'open', 'flag', and 'removeFlag' options:
    if(document.getElementById("open") != null){
        document.getElementById("open").remove();
    }
    var open = document.createElement("button");
    open.setAttribute("id", "open");
    open.innerText = "Open (o)";
    document.getElementById("tableFooter").appendChild(open);
    
    open.addEventListener('click', function(){
        openASquare(y_pos, x_pos);
    }, false);

    if(document.getElementById("flag") != null){
        document.getElementById("flag").remove();
    }
    if(document.getElementById("removeFlag") != null){
        document.getElementById("removeFlag").remove();
    }

    if (field[y_pos][x_pos] != "flagMine" && field[y_pos][x_pos] != "flagClear"){
        var flag = document.createElement("button");
        flag.setAttribute("id", "flag");
        flag.innerText = "Flag (f)";
        document.getElementById("tableFooter").appendChild(flag);

        flag.addEventListener('click', function(){
            if (containsMine(x_pos, y_pos)){
            field[y_pos][x_pos] = "flagMine";
            } else {
            field[y_pos][x_pos] = "flagClear";
            }
            printField();
            flag.parentElement.removeChild(flag);
            open.parentElement.removeChild(open);
        }, false);
    }

    if (field[y_pos][x_pos] == "flagMine" || field[y_pos][x_pos] == "flagClear"){
        var removeFlag = document.createElement("button");
        removeFlag.setAttribute("id", "removeFlag");
        removeFlag.innerText = "Remove (r)";
        document.getElementById("tableFooter").appendChild(removeFlag);

        removeFlag.addEventListener('click', function(){
            if(e.target.classList.contains("flagClear")){
                field[y_pos][x_pos] = "flagClearRemoved";
                e.target.classList.remove("flagClear");
            }
            if(e.target.classList.contains("flagMine")){
                field[y_pos][x_pos] = "flagMineRemoved";
                e.target.classList.remove("flagMine");
            }
            e.target.style.opacity = "1";
            e.target.style.backgroundColor = "white";
            printField();
            removeFlag.parentElement.removeChild(removeFlag);
            open.parentElement.removeChild(open);
        }, false);
    }

}

function keyboardInput(e) {

    if (e.target.tagName !== 'BUTTON') return;
    
    var targetCell = e.target.parentElement;
    var targetRow = targetCell.parentElement;
    var targetRowCells = [...targetRow.children];
    var gameFieldRowsEls = [...document.querySelectorAll('#field tr')];

    var y_pos = gameFieldRowsEls.indexOf(targetRow);
    var x_pos = targetRowCells.indexOf(targetCell);

    if(e.keyCode == 70) { //Flag the square if the 'F' key is pressed.
        if (document.getElementById("flag") != null){ // Prevent flagging with keyboard if the button is clicked to unselect it, or if the square has already been flagged.
            if (containsMine(x_pos, y_pos)){
                field[y_pos][x_pos] = "flagMine";
            } else {
                field[y_pos][x_pos] = "flagClear";
            }
            printField();
            document.getElementById("open").remove();
            document.getElementById("flag").remove();
        }
    }
    if(e.keyCode == 82) { //Remove the flag if the 'R' key is pressed.
        if (document.getElementById("removeFlag") != null){
            if(e.target.classList.contains("flagClear")){
                field[y_pos][x_pos] = "flagClearRemoved";
                e.target.classList.remove("flagClear");
            }
            if(e.target.classList.contains("flagMine")){
                field[y_pos][x_pos] = "flagMineRemoved";
                e.target.classList.remove("flagMine");
            }
            e.target.style.opacity = "1";
            e.target.style.backgroundColor = "white";
            printField();
            document.getElementById("open").remove();
            document.getElementById("removeFlag").remove();
        }
    }
    if (e.keyCode == 79) { //Open the square if the 'O' key is pressed.
        if (document.getElementById("open") != null) {
            openASquare(y_pos, x_pos);
        }
    }
}


function openASquare(y_pos, x_pos){

    if(document.getElementById("open")){ // In case it's the first move, this element does not exist yet.
    document.getElementById("open").remove();
    }
    if(document.getElementById("removeFlag")){
    document.getElementById("removeFlag").remove();
    }
    if (document.getElementById("flag")){
        document.getElementById("flag").remove();
    }

    if (containsMine(x_pos, y_pos)) {
        document.getElementById("infobox").innerHTML = "BOOM! You've lost the game.";
        gameOver = true;
        revealMines();
    }

    if(!gameOver){
    clearSquare(x_pos, y_pos);
    }
    printField();

    //Check for completion of game (This block has to be below the clearSquare(); and printField(); calls because otherwise the 'amountCleared' tally will have a delay of one turn):
    var amountCleared = document.getElementsByClassName("clear").length;
    if (amountCleared + mineAmount == amountOfSquares){
        document.getElementById("infobox").innerHTML = "You have won the game!";
        gameOver = true;
        revealMines();
        printField();
    }
}


//Creating the minefield:
function createField(){

    //Dynamically generating a table/field based on the specified fieldWidth and fieldHeight:
    var minefield = document.getElementById("field").getElementsByTagName("tbody")[0];
    for (i = 1; i <= fieldHeight; i++) {
        var tableRow = minefield.insertRow(minefield.rows.length);
        for (j = 1; j <= fieldWidth; j++) {
            var tableCell = tableRow.insertCell();
            var tableButton = document.createElement("button");
            tableCell.appendChild(tableButton);
        }
    }


    //Randomly distributing the mines around the field, and looking for a different place when the spot has already been filled, so that the amount of mines is the same for each game:
    for (i = 0; i < mineAmount; i++) {
        var randomnum;
        var randomnum2;
        do {
            randomnum = (Math.floor(Math.random() * fieldHeight));
            randomnum2 = (Math.floor(Math.random() * fieldWidth)); 
        } while (containsMine(randomnum2, randomnum));

        field[randomnum][randomnum2] = "mine";
    }

    //Showing the amount of neighboring mines (if any) for each square:
    var xpos = -1; //Because I start adding to it immediately in the loop below.
    var ypos = 0;
    for (i = 0; i < amountOfSquares; i++) {
        var mines = 0;
        //With each new row, x should revert to 0, and y should be plus one:
        if (xpos < fieldWidth - 1){
            xpos++;
        } else {
            xpos = 0;
            ypos++;
        }

        //Checking horizontal neighbors:
        if(field[ypos][xpos - 1] == "mine"){
            mines++;
        }
        if(field[ypos][xpos + 1] == "mine"){
            mines++;
        }
        //Checking vertical neighbors (y is checked first, so an error will appear if you start at an y outside of the field):
        if(ypos > 0 && field[ypos - 1][xpos] == "mine"){
            mines++;
        }
        if(ypos < fieldHeight - 1 && field[ypos + 1][xpos] == "mine"){
            mines++;
        }
        //Checking diagonal neighbors:
        if(ypos > 0 && field[ypos - 1][xpos - 1] == "mine"){
            mines++;
        }
        if(ypos < fieldHeight - 1 && field[ypos + 1][xpos + 1] == "mine"){
            mines++;
        }
        if(ypos > 0 && field[ypos - 1][xpos + 1] == "mine"){
            mines++;
        }
        if(ypos < fieldHeight - 1 && field[ypos + 1][xpos - 1] == "mine"){
            mines++;
        }

        //Removing the numbers from the squares that contain a mine or have no neighboring mines:
        if(field[ypos][xpos] == "mine" || mines == 0){
            mines = null;
        }
        
        var theButton = gameField.getElementsByTagName("button")[i];

        theButton.innerHTML = mines;

        theButton.style.color = "black";
        if (theButton.innerHTML == 2){
            theButton.style.color = "darkgreen";
        }
        if (theButton.innerHTML == 3){
            theButton.style.color = "firebrick";
        }
        if (theButton.innerHTML == 4){
            theButton.style.color = "mediumblue";
        }
        if (theButton.innerHTML == 5){
            theButton.style.color = "darkmagenta";
        }
        if (theButton.innerHTML == 6){
            theButton.style.color = "chocolate";
        }
        if (theButton.innerHTML == 7){
            theButton.style.color = "brown";
        }
        if (theButton.innerHTML == 8){
            theButton.style.color = "lightseagreen";
        }
    }

    //Creating a background in which the squares are colored in a diagonal pattern:
    var count = 0;
    var count2 = 0;
    for (var row of gameField.getElementsByTagName("tr")){
        count2++;
        for (var btn of row.getElementsByTagName("button")){
            count++;

            if(count % 2 && count2 % 2){
                btn.style.filter = "brightness(97%)";
            }
            if(!(count % 2) && !(count2 % 2)){
                btn.style.filter = "brightness(97%)";
            }
        }
    }
}

var squaresToCheck = [];
function checkSquare(x_pos, y_pos){ //This function is called below for each square that neighbors the clicked square, if both of them are clear.
    squaresToCheck.push(x_pos + "/" + y_pos); //Add each unique pair of coordinates to an array to be able to mark them as checked, so that there is no recursive loop.

    clearSquare(x_pos, y_pos);
}

function clearSquare(x_pos, y_pos) {
    field[y_pos][x_pos] = "clear";


    //Reveal all neighboring squares if the clicked square is 0. Among the revealed squares, have all the clear ones be checked as well, without getting into a recursive loop:

    var row = document.querySelector('tr:nth-child(' + (1 + y_pos) + ')');
    var cell = row.querySelector('td:nth-child(' + (1 + x_pos) + ')');
    var theSquare = cell.firstElementChild;

    if(theSquare.innerHTML == ""){

        //The square to the left of the clicked square:
        if(x_pos > 0){ //For each neiboring square there needs to be a condition to prevent errors caused by trying to check a square that's outside of the board's range.
            var cell2 = row.querySelector('td:nth-child(' + (x_pos) + ')');
            var theSquare2 = cell2.firstElementChild;
            if(!squaresToCheck.includes((x_pos - 1) + "/" + y_pos) && theSquare2.innerHTML == ""){
                checkSquare(x_pos - 1, y_pos);
            }
            field[y_pos][x_pos - 1] = "clear";
        }

        //The square to the right:
        if(x_pos < fieldWidth - 1){
            var cell3 = row.querySelector('td:nth-child(' + (2 + x_pos) + ')');
            var theSquare3 = cell3.firstElementChild;
            if(!squaresToCheck.includes((x_pos + 1) + "/" + y_pos) && theSquare3.innerHTML == ""){
                checkSquare(x_pos + 1, y_pos);
            }
            field[y_pos][x_pos + 1] = "clear";
        }

        //The square below:
        if(y_pos < fieldHeight - 1){
            var row2 = document.querySelector('tr:nth-child(' + (2 + y_pos) + ')');
            var cell4 = row2.querySelector('td:nth-child(' + (1 + x_pos) + ')');
            var theSquare4 = cell4.firstElementChild;
            if(!squaresToCheck.includes(x_pos + "/" + (y_pos + 1)) && theSquare4.innerHTML == ""){
                checkSquare(x_pos, y_pos + 1);
            }
            field[y_pos + 1][x_pos] = "clear";
        }

        //The square above:
        if(y_pos > 0){
            var row3 = document.querySelector('tr:nth-child(' + (y_pos) + ')');
            var cell5 = row3.querySelector('td:nth-child(' + (1 + x_pos) + ')');
            var theSquare5 = cell5.firstElementChild;
            if(!squaresToCheck.includes(x_pos + "/" + (y_pos - 1)) && theSquare5.innerHTML == ""){
                checkSquare(x_pos, y_pos - 1);
            }
            field[y_pos - 1][x_pos] = "clear";
        }

        //The bottom-right diagonal:
        if(x_pos < fieldWidth - 1 && y_pos < fieldHeight - 1){
            var cell6 = row2.querySelector('td:nth-child(' + (2 + x_pos) + ')');
            var theSquare6 = cell6.firstElementChild;
            if(!squaresToCheck.includes((x_pos + 1) + "/" + (y_pos + 1)) && theSquare6.innerHTML == ""){
                checkSquare(x_pos + 1, y_pos + 1);
            }
            field[y_pos + 1][x_pos + 1] = "clear";
        }

        //The bottom-left diagonal:
        if(x_pos > 0 && y_pos < fieldHeight - 1){
            var cell7 = row2.querySelector('td:nth-child(' + (x_pos) + ')');
            var theSquare7 = cell7.firstElementChild;
            if(!squaresToCheck.includes((x_pos - 1) + "/" + (y_pos + 1)) && theSquare7.innerHTML == ""){
                checkSquare(x_pos - 1, y_pos + 1);
            }
            field[y_pos + 1][x_pos - 1] = "clear";
        }

        //The upper-right diagonal:
        if(x_pos < fieldWidth - 1 && y_pos > 0){
            var cell8 = row3.querySelector('td:nth-child(' + (2 + x_pos) + ')');
            var theSquare8 = cell8.firstElementChild;
            if(!squaresToCheck.includes((x_pos + 1) + "/" + (y_pos - 1)) && theSquare8.innerHTML == ""){
                checkSquare(x_pos + 1, y_pos - 1);
            }
            field[y_pos - 1][x_pos + 1] = "clear";
        }

        //The upper-left diagonal:
        if(x_pos > 0 && y_pos > 0){
            var cell9 = row3.querySelector('td:nth-child(' + (x_pos) + ')');
            var theSquare9 = cell9.firstElementChild;
            if(!squaresToCheck.includes((x_pos - 1) + "/" + (y_pos - 1)) && theSquare9.innerHTML == ""){
                checkSquare(x_pos - 1, y_pos - 1);
            }
            field[y_pos - 1][x_pos - 1] = "clear";
        }        

    }
}

function printField() { //Updates the field by giving each square its appropriate value (mine, flagged, etc.).
    var row, cell;
    for (var y = 0; y < fieldHeight; y++) {
        for (var x = 0; x < fieldWidth; x++) {
        if (squareIsChangedOrMine(x, y)) {
            row = document.querySelector('tr:nth-child(' + (1 + y) + ')');
            cell = row.querySelector('td:nth-child(' + (1 + x) + ')');
            cell.firstElementChild.classList.add(field[y][x]);
        }
        }
    }
}

function squareIsChangedOrMine(x_pos, y_pos) {
    return field[y_pos][x_pos] !== 0;
}

function containsMine(x_pos, y_pos) {
    return field[y_pos][x_pos] == "mine" || field[y_pos][x_pos] == "flagMine" || field[y_pos][x_pos] == "flagMineRemoved";
}

function revealMines(){
    for(var i = 0; i < fieldWidth; i++) {
        for(var j = 0; j < fieldHeight; j++){
            if(containsMine(i, j)){
                field[j][i] = "mineReveal";
            }
        }
    }
    //Opening up flagged squares that did not contain a mine: 
    var flaggedClears = document.getElementsByClassName("flagClear");
    for (var i = 0; i < flaggedClears.length; i++){
        if(!flaggedClears.item(i).classList.contains("clear")){ //Only the flagged squares that have not been cleared yet should be made white.
            flaggedClears.item(i).style.setProperty('background-color', 'white', 'important'); // Using the 'setProperty' method to be able to override the '!important' suffix of flagged squares' background-color.
            flaggedClears.item(i).innerHTML = "";
        }
    }
    gameField.removeEventListener('click', clickSquare);
}
