const database = firebase.database();
let winningTeam = 100;
let guessed, signedIn, darkMode = false;
let players;    
$(`.hide`).on("click", () => {
    hideModal();
})
$(`#blueTeam`).on("click", () => {
    guess(100);
})
$(`#redTeam`).on("click", () => {
    guess(200);
})
$(`#signUp`).on("click", () => {
    if ($(`#signUp`).attr('disabled')) return;
    showModal("signUp");
})
$(`#swapTheme`).on("click", () => {
    swapTheme();
})
$(`#emailInput`).on('input', () => {
    if (checkValid($(`#emailInput`))) {
        $(`#emailCheck`).show();
    } else {
        $(`#emailCheck`).hide();
    }
});
$(`#passwordInput`).on('input', () => {
    if (checkValid($(`#passwordInput`))) {
        $(`#passwordCheck`).show();
    } else {
        $(`#passwordCheck`).hide();
    }
});
function checkValid(target) {
    let regex = (target.attr('id') == `emailInput`) ? /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/ : /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (regex.test(target.val())) {
       target.removeClass("is-danger");
       target.addClass("is-primary");
       return true;
    } else {
        target.removeClass("is-primary");
        target.addClass("is-danger");
        return false;
    }
}
$(`#logIn`).on("click", () => {
    if (signedIn) {
        firebase.auth().signOut().then(() => {
            $(`#signUp`).html(`<strong> Sign Up </strong>`);
            $(`#signUp`).removeAttr("disabled");
            $(`#logIn`).html("<strong> Log In </strong>");
          })
        signedIn = false;
    } else {
        showModal("logIn");
    }
})
$(`#playAgain`).on("click", () => {
    $(`.team`).empty();
    document.getElementById("playAgain").style.display = "none";
    $(`#message`).removeClass("has-text-danger", "has-text-primary");
    guessed = false;
    $(`.main`).addClass("hover");
    getMatch();
});
async function getMatch() {
    const response = await axios({
        method: 'get',
        url: 'https://n17xzh21o2.execute-api.us-east-1.amazonaws.com/1/test',
    });
    // Stats I want: summonerName, teamPosition, 
    players = response.data.info.participants;
    winningTeam = (players[0].win) ? players[0].teamId : players[9].teamId;
    players.forEach(player => {
        let team = (player.teamId == 100) ? "blue" : "red";
        $(`#${team}Col`).append(`<div id="${team}${player.teamPosition}" class="columns column is-full">
                    <div class="column is-2">
                    <figure class="image is-1by1">
                        <img class="is-rounded" src="./tiles/${player.championName}_0.jpg">
                    </figure>
                    </div>
                    <div class="column">
                    <p class="title has-text-light"> ${player.summonerName} </p>
                    <p class="subtitle is-4 has-text-light"> ${player.championName} </p>
                    </div>
                    </div>`);          
    });
}

function guess(guessTeam) {
    let message, color = "";
    if (guessed) {
        return;
    }
    guessed = true;
    $(`.main`).removeClass("hover");
    if (guessTeam == winningTeam) {
        $(`#curPoints`).html(parseInt($(`#curPoints`).html()) + 100);
        message = "Correct!";
        color = "has-text-primary";
    } else {
        $(`#curPoints`).html(parseInt($(`#curPoints`).html()) - 100);
        message = "Wrong!";
        color = "has-text-danger";
    }
    if (signedIn) {
        var user = firebase.auth().currentUser;
        firebase.database().ref('users/' + user.uid).update({
            points : parseInt($(`#curPoints`).html())
        });
    }
    players.forEach(player => {
        let team = (player.teamId == 100) ? "blue" : "red";
        let row = $(`#${team}${player.teamPosition}`);
        row.append(`<div class="column">
        <p class="title has-text-light"> ${player.kills}/${player.deaths}/${player.assists} </p>
        </div>`);  
        $(`#message`).html(message)
        $(`#message`).addClass(color);
        document.getElementById("playAgain").style.display = "block";
    })
}
function showModal(type) {
    $('.input').val("");
    $(`#signModal`).addClass("is-active");
    if (type == "signUp") {
        $(`#sendSign`).html("Sign Up")
        $(`#sendSign`).on("click", () => {
            signUp();
        })
    } else {
        document.getElementById("usernameField").style.display = "none";
        $(`#sendSign`).html("Log In")
        $(`#sendSign`).on("click", () => {
            logIn();
        })
    }
}
function hideModal() {
    $(`#signModal`).removeClass("is-active");
    $('#passwordInput').removeClass("is-primary is-danger");
    $('#emailInput').removeClass("is-primary is-danger");
    document.getElementById("usernameField").style.display = "block";
    $(`.is-right`).hide();
    $(`#sendSign`).off();
    $(`#error`).html();
}
function signUp() {
    firebase.auth().createUserWithEmailAndPassword($("#emailInput").val(), $("#passwordInput").val()).then(regUser => {
        database.ref('users/' + regUser.user.uid).set({
            username: $(`#usernameInput`).val(),
            points: parseInt($(`#curPoints`).html()),
            darkMode: darkMode
        })
        $(`#signUp`).html(`<strong> Logged In: ${$(`#usernameInput`).val()} </strong>`);
        $(`#signUp`).attr("disabled", "true");
        $(`#logIn`).html("<strong> Log Out </strong>");
        $('#emailInput').on('input', () => {
            checkValid($(`#emailInput`));
        });
        signedIn = true;
        hideModal();
    })
    .catch((error) => {
        let message = $(`#error`);
        switch(error.code) {
            case "auth/invalid-email":
                message.html("Please enter a valid email");
                break;
            case "auth/weak-password":  
                message.html("Please enter a valid password");
                break;
            case "auth/email-already-in-use":
                message.html("Email is already in use.");
                break;
        }
        return;
    });
}
function logIn() {
    firebase.auth().signInWithEmailAndPassword($(`#emailInput`).val(), $(`#passwordInput`).val())
    .then((userCredential) => {
        var user = userCredential.user;
        const dbRef = firebase.database().ref();
        dbRef.child("users").child(user.uid).get().then((snapshot) => {
        if (snapshot.exists()) {
            $(`#curPoints`).html(snapshot.val().points);
            $(`#signUp`).html(`<strong> Logged In: ${snapshot.val().username} </strong>`);
            $(`#signUp`).attr("disabled", "true");
            $(`#logIn`).html("<strong> Log Out </strong>");
            signedIn = true;
            if (darkMode != snapshot.val().darkMode) {
                swapTheme();
            }
        }
        })
    })
    .catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    });
    hideModal();
}
function swapTheme() {
    if (darkMode) {        
        $(`#swapTheme`).html("<strong> Go Dark </strong>");
    } else {
        $(`#swapTheme`).html("<strong> Go Light </strong>");
    }
    $(`#blueTeam`).toggleClass("has-background-info has-background-info-dark");
    $(`#redTeam`).toggleClass("has-background-danger has-background-danger-dark");
    $(`.label`).toggleClass("has-text-white");
    $(`body,html`).toggleClass("darkMode");
    $(`#swapTheme`).toggleClass("is-white is-black");
    $(`#navbar`).toggleClass("darkMode");
    $(`#modalSec`).toggleClass("has-background-white has-background-black");
    $(`p`).toggleClass("has-text-white");
    darkMode = !darkMode;
    if (signedIn) {
        var user = firebase.auth().currentUser;
        firebase.database().ref('users/' + user.uid).update({
            darkMode: darkMode
        });
    }
}
window.onload = function() {
    getMatch();
}