var DICTIONARY;
var originalBackgroundColor = $('body').css('background-color');

$(document).ready(function() {
  getData(
    'greek.csv',
    function(words){
      DICTIONARY = words;
      presentQuestion(DICTIONARY);
    }
  );
  $('#chapterSelect').click(function(){
    presentQuestion(DICTIONARY);
  });
});

function getData (fileName, callback){
  $.ajax({
    url: fileName,
    async: false,
    success: function (csvd) {
      var items = $.csv.toObjects(csvd);
      callback(items);
    },
    dataType: "text"
  });
}

function presentQuestion (DICTIONARY){
  var questionData = randomQuestionData (DICTIONARY);
  var questionHTML = buildQuestion(questionData);
  $('#main').html(questionHTML);

}

function randomQuestionData (DICTIONARY) {
  var words = $.extend(true, [], DICTIONARY);

  var wordsToUse = words.filter(function(word) {
    return word.chapter <= Number($('#chapterSelect').val());
  }); 

  var questionLang = Math.random() < 0.5 ? 'greek' : 'english';
  var optionLang = questionLang == 'greek' ? 'english' : 'greek';

  var question = {}

  var randomWord = randomItem(wordsToUse);
  question.word = randomWord.item[questionLang];
  question.translation = randomWord.item[optionLang];

  var filteredWords = words.filter(function(word) {
    return (word.type == randomWord.item.type && word.greek != randomWord.item.greek);
  });

  question.distractors = [];
  for (i = 0; i < CONFIG.options - 1; i++) {
    var randomWord = randomItem(filteredWords);
    question.distractors.push(randomWord.item[optionLang]);
    filteredWords.splice (randomWord.index, 1);
  }

  return question;
}


function buildQuestion (data){
  var questionHTML = $('<div class="container" id="question"></div>');
  questionHTML.append('<div class="row"><div class="col" id="questionDiv">' + data.word + '</div></div>');

  var optionsHTML = [];
  var optionsRow = $('<div class="row" id="options"></div>');
  optionsHTML.push($('<div class="col-xl-2 col-md-3 col-sm-6 optionDiv"><button type="button" class="btn btn-outline-primary btn-lg" data-correct="true">' + data.translation + '</button></div>'));
  $.each(data.distractors, function(index, distractor){
    optionsHTML.push($('<div class="col-xl-2 col-md-3 col-sm-6 optionDiv"><button type="button" class="btn btn-outline-primary btn-lg" data-correct="false">' + distractor + '</button></div>'));
  });
  shuffle(optionsHTML);
  $.each(optionsHTML, function(index, optionHTML){
    optionsRow.append(optionsHTML);
  });
  questionHTML.append(optionsRow);

  questionHTML.find('button').click(function(){
    processQuestion(
      $(this).attr('data-correct') == 'true' ? true : false,
      $(this)
    );
  });

  return questionHTML;
}

function processQuestion(answeredCorrectly, optionSelected){
  var optionCorrect;
  var feedbackTimeoutSeconds;
  $('#options button').unbind();

  $.each($('#options button'), function(index, button){
    $(button).removeClass('btn-outline-primary');
    if ($(button).attr('data-correct') == 'true'){
      $(button).addClass('btn-success');
      optionCorrect = $(button);
    }
    else {
      $(button).addClass('btn-danger');
    }
  });

  if (answeredCorrectly == true){
    feedbackTimeoutSeconds = CONFIG.correctfeedbackTimeoutSeconds;
    $('body').addClass('correct');
    var message = 'Correct! The right answer is "' + optionCorrect.text() + '".';
    $('#question').append('<div class="row" id="feedback"><div class="col" id="feedbackDiv"><div class="alert alert-success" role="alert">' + message + '</div></div></div>');
  }
  else {
    feedbackTimeoutSeconds = CONFIG.incorrectfeedbackTimeoutSeconds;
    $('body').addClass('incorrect');
    var message = 'Incorrect!  You selected "' + optionSelected.text() + '". The right answer was "' + optionCorrect.text() + '".';
    $('#question').append('<div class="row" id="feedback"><div class="col" id="feedbackDiv"><div class="alert alert-danger" role="alert">' + message + '</div></div></div>');
    optionSelected.removeClass('btn-danger').addClass('btn-outline-danger');
  }

  var newBackgroundColor = $('body').css('background-color');
  $('body')
    .css("background-color", newBackgroundColor)
    .css("transition", "background-color " + feedbackTimeoutSeconds + "s ease-in")
    .css("background-color", originalBackgroundColor);

  setTimeout(
    resetQuestion, 
    feedbackTimeoutSeconds * 1000
  );
}

function resetQuestion() {
  $('body')
    .removeClass('correct')
    .removeClass('incorrect')
    .css('background-color','')
    .css('transition','')
  presentQuestion (DICTIONARY);
}

function randomItem (items){
  var index = Math.floor(Math.random()*items.length);
  return {
    index: index,
    item: items[index]
  };
}

// https://stackoverflow.com/a/6274381
function shuffle (items) {
  var j, x, i;
  for (i = items.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = items[i];
    items[i] = items[j];
    items[j] = x;
  }
  return items;
}