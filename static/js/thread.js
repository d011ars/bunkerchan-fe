var boardUri;
var threadId;
var board = false;
var replyButton;
var fullRefresh = false;
var refreshButton;
var lastReplyId;
var refreshLabel;
var autoRefresh;
var refreshTimer;
var lastRefresh;
var currentRefresh;
var manualRefresh;
var foundPosts;
var refreshingThread;
var hiddenCaptcha = !document.getElementById('captchaDiv');
var markedPosting;
var limitRefreshWait = 10 * 60;
var originalButtonText;
var messageLimit;
var unreadPosts;
var originalTitle;
var lastPost;
var highLightedIds;
var idsRelation;
var refreshURL;

var reverseHTMLReplaceTable = {
  '&lt;' : '<',
  '&gt;' : '>'
};

var postCellTemplate = '<div class="innerPost"><div class="postInfo title">'
    + '<input type="checkbox" class="deletionCheckBox"> <span class="labelSubject">'
    + '</span> <a class="linkName"></a> <img class="imgFlag"> <span class="labelRole">'
    + '</span> <span class="labelCreated"></span> <span class="spanId"> Id:<span '
    + 'class="labelId"></span></span> <a class="linkPreview">[Preview]</a> <a '
    + 'class="linkSelf">No.</a> <a class="linkQuote"></a> <span class="panelBacklinks">'
    + '</span></div>'
    + '<div>'
    + '<span class="panelIp"> <span class="panelRange">Broad'
    + 'range(1/2 octets): <span class="labelBroadRange"> </span> <br>'
    + 'Narrow range(3/4 octets): <span class="labelNarrowRange"> </span> <br>'
    + '</span> Ip: <span class="labelIp"></span></span>'
    + '</div>'
    + '<div class="panelUploads"></div><div class="divMessage"></div>'
    + '<div class="divBanMessage"></div><div class="labelLastEdit"></div></div>';

var uploadCell = '<div class="uploadDetails"><a class="nameLink" target="blank">'
    + 'Open file</a> (<span class="sizeLabel"></span> <span class="dimensionLabel">'
    + '</span> <a class="originalNameLink"></a>)</div>'
    + '<div class="divHash"><span>MD5: <span class="labelHash"></span></span></div>'
    + '<a class="imgLink" ' + 'target="blank"></a>';

var sizeOrders = [ 'B', 'KB', 'MB', 'GB', 'TB' ];

var guiEditInfo = 'Edited last time by {$login} on {$date}.';

function initThread() {

  lastPost = null;
  lastReplyId = 0;
  originalTitle = document.title;
  highLightedIds = [];
  idsRelation = {};
  unreadPosts = 0;
  threadId = +document.getElementsByClassName('opCell')[0].id;
  refreshURL = document.getElementById('divMod') ? '/mod.js?boardUri='
      + boardUri + '&threadId=' + threadId + '&json=1' : '/' + boardUri
      + '/res/' + threadId + '.json';

}

if (!DISABLE_JS) {

  document.getElementById('mainPanel').onscroll = function() {

    if (!unreadPosts) {
      return;
    }

    var rect = lastPost.getBoundingClientRect();

    if (rect.bottom < window.innerHeight) {
      unreadPosts = 0;

      document.title = originalTitle;
    }

  };

  boardUri = document.getElementById('boardIdentifier').value;
  var divPosts = document.getElementsByClassName('divPosts')[0];

  initThread();

  document.getElementsByClassName('divRefresh')[0].style.display = 'block';

  messageLimit = +document.getElementById('labelMessageLength').innerHTML;
  refreshLabel = document.getElementById('labelRefresh');

  refreshButton = document.getElementById('refreshButton');

  if (document.getElementById('controlThreadIdentifier')) {
    document.getElementById('settingsJsButon').style.display = 'inline';
    document.getElementById('settingsFormButon').style.display = 'none';

    if (document.getElementById('ipDeletionForm')) {
      document.getElementById('deleteFromIpJsButton').style.display = 'inline';

      document.getElementById('deleteFromIpFormButton').style.display = 'none';
    }

    if (document.getElementById('formTransfer')) {
      document.getElementById('transferJsButton').style.display = 'inline';

      document.getElementById('transferFormButton').style.display = 'none';
    }

  }

  replyButton = document.getElementById('jsButton');
  replyButton.style.display = 'inline';
  replyButton.disabled = false;

  if (document.getElementById('captchaDiv')) {
    document.getElementById('reloadCaptchaButton').style.display = 'inline';
  }

  document.getElementById('reloadCaptchaButtonReport').style.display = 'inline';

  document.getElementById('formButton').style.display = 'none';

  var replies = document.getElementsByClassName('postCell');

  if (replies && replies.length) {
    lastReplyId = replies[replies.length - 1].id;
  }

  changeRefresh();

  var hash = window.location.hash.substring(1);

  if (hash.indexOf('q') === 0 && hash.length > 1) {
    document.getElementById('fieldMessage').value = '>>' + hash.substring(1)
        + '\n';
  } else if (hash.length > 0) {
    markPost(hash);
  }

  var postingQuotes = document.getElementsByClassName('linkQuote');

  for (var i = 0; i < postingQuotes.length; i++) {
    processPostingQuote(postingQuotes[i]);
  }

  var ids = document.getElementsByClassName('labelId');

  for (i = 0; i < ids.length; i++) {
    processIdLabel(ids[i]);
  }
}

function processIdLabel(label) {

  var id = label.innerHTML;

  var array = idsRelation[id] || [];
  idsRelation[id] = array;

  var cell = label.parentNode.parentNode.parentNode;

  array.push(cell);

  label.onmouseover = function() {
    label.innerHTML = id + ' (' + array.length + ')';
  }

  label.onmouseout = function() {
    label.innerHTML = id;
  }

  label.onclick = function() {

    var index = highLightedIds.indexOf(id);

    if (index > -1) {
      highLightedIds.splice(index, 1);
    } else {
      highLightedIds.push(id);
    }

    for (var i = 0; i < array.length; i++) {
      var cellToChange = array[i];

      if (cellToChange.className === 'innerOP') {
        continue;
      }

      cellToChange.className = index > -1 ? 'innerPost' : 'markedPost';
    }

  };

}

function transfer() {

  var informedBoard = document.getElementById("fieldDestinationBoard").value
      .trim();

  var originThread = document.getElementById("transferThreadIdentifier").value;
  var originBoard = document.getElementById("transferBoardIdentifier").value;

  apiRequest('transferThread', {
    boardUri : boardUri,
    threadId : threadId,
    boardUriDestination : informedBoard
  }, function setLock(status, data) {

    if (status === 'ok') {

      alert('Thread moved.');

      var redirect = '/' + informedBoard + '/res/';

      window.location.pathname = redirect + data + '.html';

    } else {
      alert(status + ': ' + JSON.stringify(data));
    }
  });

}

function markPost(id) {

  if (isNaN(id)) {
    return;
  }

  if (markedPosting && markedPosting.className === 'markedPost') {
    markedPosting.className = 'innerPost';
  }

  var container = document.getElementById(id);

  if (!container || container.className !== 'postCell') {
    return;
  }

  markedPosting = container.getElementsByClassName('innerPost')[0];

  if (markedPosting) {
    markedPosting.className = 'markedPost';
  }
}

function processPostingQuote(link) {

  link.onclick = function() {
    var toQuote = link.href.match(/#q(\d+)/)[1];

    showQr(link, toQuote);

    document.getElementById('fieldMessage').value += '>>' + toQuote + '\n';

  };

}

function saveThreadSettings() {

  apiRequest('changeThreadSettings', {
    boardUri : boardUri,
    threadId : threadId,
    pin : document.getElementById('checkboxPin').checked,
    lock : document.getElementById('checkboxLock').checked,
    cyclic : document.getElementById('checkboxCyclic').checked
  }, function setLock(status, data) {

    if (status === 'ok') {

      alert('Settings saved.');

      location.reload(true);

    } else {
      alert(status + ': ' + JSON.stringify(data));
    }
  });

}

var replyCallback = function(status, data) {

  if (status === 'ok') {

    storeUsedPostingPassword(boardUri, threadId, data);

    document.getElementById('fieldMessage').value = '';
    document.getElementById('fieldSubject').value = '';
    clearQRAfterPosting();
    clearSelectedFiles();

    refreshPosts(true);

  } else {
    alert(status + ': ' + JSON.stringify(data));
  }
};

replyCallback.stop = function() {
  replyButton.innerHTML = originalButtonText;

  setQRReplyText(originalButtonText);

  replyButton.disabled = false;
  setQRReplyEnabled(true);
};

replyCallback.progress = function(info) {

  if (info.lengthComputable) {
    var newText = 'Uploading ' + Math.floor((info.loaded / info.total) * 100)
        + '%';
    replyButton.innerHTML = newText;

    setQRReplyText(newText);
  }
};

function padDateField(value) {
  if (value < 10) {
    value = '0' + value;
  }

  return value;
}

function formatDateToDisplay(d) {
  var day = padDateField(d.getUTCDate());

  var weekDays = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];

  var month = padDateField(d.getUTCMonth() + 1);

  var year = d.getUTCFullYear();

  var weekDay = weekDays[d.getUTCDay()];

  var hour = padDateField(d.getUTCHours());

  var minute = padDateField(d.getUTCMinutes());

  var second = padDateField(d.getUTCSeconds());

  var toReturn = month + '/' + day + '/' + year;

  return toReturn + ' (' + weekDay + ') ' + hour + ':' + minute + ':' + second;
}

function formatFileSize(size) {

  var orderIndex = 0;

  while (orderIndex < sizeOrders.length - 1 && size > 1024) {

    orderIndex++;
    size /= 1024;

  }

  return size.toFixed(2) + ' ' + sizeOrders[orderIndex];

}

function setLastEditedLabel(post, cell) {

  var editedLabel = cell.getElementsByClassName('labelLastEdit')[0];

  if (post.lastEditTime) {

    var formatedDate = formatDateToDisplay(new Date(post.lastEditTime));

    editedLabel.innerHTML = guiEditInfo.replace('{$date}', formatedDate)
        .replace('{$login}', post.lastEditLogin);

  } else {
    editedLabel.remove();
  }

}

function setUploadLinks(cell, file) {
  var thumbLink = cell.getElementsByClassName('imgLink')[0];
  thumbLink.href = file.path;

  thumbLink.setAttribute('data-filemime', file.mime);

  if (file.mime.indexOf('image/') > -1) {
    addGalleryFile(file.path);
  }

  var img = document.createElement('img');
  img.src = file.thumb;

  thumbLink.appendChild(img);

  var nameLink = cell.getElementsByClassName('nameLink')[0];
  nameLink.href = file.path;

  var originalLink = cell.getElementsByClassName('originalNameLink')[0];
  originalLink.innerHTML = file.originalName;
  originalLink.href = file.path;
  originalLink.setAttribute('download', file.originalName);
}

function getUploadCellBase() {
  var cell = document.createElement('figure');
  cell.innerHTML = uploadCell;
  cell.className = 'uploadCell';

  return cell;
}

function setUploadCell(node, files) {

  if (!files) {
    return;
  }

  for (var i = 0; i < files.length; i++) {
    var file = files[i];

    var cell = getUploadCellBase();

    setUploadLinks(cell, file);

    var sizeString = formatFileSize(file.size);
    cell.getElementsByClassName('sizeLabel')[0].innerHTML = sizeString;

    var dimensionLabel = cell.getElementsByClassName('dimensionLabel')[0];

    if (file.width) {
      dimensionLabel.innerHTML = file.width + 'x' + file.height;
    } else {
      dimensionLabel.remove();
    }

    if (file.md5) {
      cell.getElementsByClassName('labelHash')[0].innerHTML = file.md5;
    } else {
      cell.getElementsByClassName('divHash')[0].remove();
    }

    node.appendChild(cell);
  }

}

function setPostHideableElements(postCell, post) {
  var subjectLabel = postCell.getElementsByClassName('labelSubject')[0];
  if (post.subject) {
    subjectLabel.innerHTML = post.subject;
  } else {
    subjectLabel.remove();
  }

  if (post.id) {
    var labelId = postCell.getElementsByClassName('labelId')[0];
    labelId.setAttribute('style', 'background-color: #' + post.id);
    labelId.innerHTML = post.id;

    processIdLabel(labelId);

  } else {
    var spanId = postCell.getElementsByClassName('spanId')[0];
    spanId.remove();
  }

  var banMessageLabel = postCell.getElementsByClassName('divBanMessage')[0];

  if (!post.banMessage) {
    banMessageLabel.parentNode.removeChild(banMessageLabel);
  } else {
    banMessageLabel.innerHTML = post.banMessage;
  }

  setLastEditedLabel(post, postCell);

  var imgFlag = postCell.getElementsByClassName('imgFlag')[0];

  if (post.flag) {
    imgFlag.src = post.flag;
    imgFlag.title = post.flagName.replace(/&(l|g)t;/g, function replace(match) {
      return reverseHTMLReplaceTable[match];
    });

    if (post.flagCode) {
      imgFlag.className += ' flag' + post.flagCode;
    }
  } else {
    imgFlag.remove();
  }

  if (!post.ip) {
    postCell.getElementsByClassName('panelIp')[0].remove();
  } else {

    postCell.getElementsByClassName('labelIp')[0].innerHTML = post.ip;

    if (!post.broadRange) {
      postCell.getElementsByClassName('panelRange')[0].remove();
    } else {

      postCell.getElementsByClassName('labelBroadRange')[0].innerHTML = post.broadRange;
      postCell.getElementsByClassName('labelNarrowRange')[0].innerHTML = post.narrowRange;

    }

  }

}

function setPostLinks(postCell, post, boardUri, link, threadId, linkQuote,
    deletionCheckbox) {

  var postingId = post.postId || threadId;

  var linkStart = '/' + boardUri + '/res/' + threadId + '.html#';

  linkQuote.href = linkStart;
  link.href = linkStart;

  link.href += postingId;
  linkQuote.href += 'q' + postingId;

  var checkboxName = boardUri + '-' + threadId;

  if (post.postId) {
    checkboxName += '-' + post.postId;
  }

  deletionCheckbox.setAttribute('name', checkboxName);

  var linkPreview = '/' + boardUri + '/preview/' + (post.postId || threadId)
      + '.html';

  postCell.getElementsByClassName('linkPreview')[0].href = linkPreview;
}

function setRoleSignature(postingCell, posting) {
  var labelRole = postingCell.getElementsByClassName('labelRole')[0];

  if (posting.signedRole) {
    labelRole.innerHTML = posting.signedRole;
  } else {
    labelRole.parentNode.removeChild(labelRole);
  }
}

function setPostComplexElements(postCell, post, boardUri, threadId) {

  setRoleSignature(postCell, post);

  var link = postCell.getElementsByClassName('linkSelf')[0];

  var linkQuote = postCell.getElementsByClassName('linkQuote')[0];
  linkQuote.innerHTML = post.postId || threadId;

  var deletionCheckbox = postCell.getElementsByClassName('deletionCheckBox')[0];

  setPostLinks(postCell, post, boardUri, link, threadId, linkQuote,
      deletionCheckbox);

  setUploadCell(postCell.getElementsByClassName('panelUploads')[0], post.files);
}

function setPostInnerElements(boardUri, threadId, post, postCell) {

  var linkName = postCell.getElementsByClassName('linkName')[0];

  linkName.innerHTML = post.name;

  if (post.email) {
    linkName.href = 'mailto:' + post.email;
  } else {
    linkName.className += ' noEmailName';
  }

  var labelCreated = postCell.getElementsByClassName('labelCreated')[0];

  labelCreated.innerHTML = formatDateToDisplay(new Date(post.creation));

  postCell.getElementsByClassName('divMessage')[0].innerHTML = post.markdown;

  setPostHideableElements(postCell, post);

  setPostComplexElements(postCell, post, boardUri, threadId);

  var messageLinks = postCell.getElementsByClassName('divMessage')[0]
      .getElementsByTagName('a');

  for (var i = 0; i < messageLinks.length; i++) {
    processLinkForEmbed(messageLinks[i]);
  }

  var links = postCell.getElementsByClassName('imgLink');

  var temporaryImageLinks = [];

  for (i = 0; i < links.length; i++) {
    temporaryImageLinks.push(links[i]);
  }

  for (i = 0; i < temporaryImageLinks.length; i++) {
    processImageLink(temporaryImageLinks[i]);
  }

  var shownFiles = postCell.getElementsByClassName('uploadCell');

  for (var i = 0; i < shownFiles.length; i++) {
    processFileForHiding(shownFiles[i]);
  }

  var hiddenMedia = getHiddenMedia();

  for (i = 0; i < hiddenMedia.length; i++) {
    updateHiddenFiles(hiddenMedia[i], true);
  }

  postCell.setAttribute('data-boarduri', boardUri);

  addToKnownPostsForBackLinks(postCell);

  var quotes = postCell.getElementsByClassName('quoteLink');

  for (i = 0; i < quotes.length; i++) {
    processQuote(quotes[i]);
  }

  var checkbox = postCell.getElementsByClassName('deletionCheckBox')[0];

  setHideMenu(checkbox);
  setExtraMenu(checkbox)

  processPostingQuote(postCell.getElementsByClassName('linkQuote')[0]);
}

function addPost(post) {

  if (!fullRefresh) {
    unreadPosts++;
  }

  var postCell = document.createElement('div');
  postCell.innerHTML = postCellTemplate;

  postCell.id = post.postId;
  postCell.className = 'postCell';

  if (post.files && post.files.length > 1) {
    postCell.className += ' multipleUploads';
  }

  divPosts.appendChild(postCell);

  setPostInnerElements(boardUri, threadId, post, postCell);

  lastPost = postCell;

}

var refreshCallback = function(error, data) {

  if (error) {
    return;
  }

  if (fullRefresh) {
    lastReplyId = 0;
    unreadPosts = 0;
    while (divPosts.firstChild) {
      divPosts.removeChild(divPosts.firstChild);
    }

    document.title = originalTitle;

  }

  var receivedData = JSON.parse(data);

  var posts = receivedData.posts;

  foundPosts = false;

  if (posts && posts.length) {
    var lastPost = posts[posts.length - 1];

    if (lastPost.postId > lastReplyId) {
      foundPosts = true;

      for (var i = 0; i < posts.length; i++) {

        var post = posts[i];

        if (post.postId > lastReplyId) {
          addPost(post);
          lastReplyId = post.postId;
        }

      }

      if (!fullRefresh) {
        document.title = '(' + unreadPosts + ') ' + originalTitle;
      }

    }
  }

  if (autoRefresh) {
    startTimer(manualRefresh || foundPosts ? 5 : lastRefresh * 2);
  }

};

refreshCallback.stop = function() {
  refreshButton.disabled = false;

  refreshingThread = false;

  if (waitingForRefreshData) {
    loadThread(waitingForRefreshData.cell, waitingForRefreshData.thread);
    waitingForRefreshData = false;
  }

};

function refreshPosts(manual, full) {

  if (manual && loadingThread) {
    return;
  }

  manualRefresh = manual;
  fullRefresh = full;

  if (autoRefresh && manual) {
    clearInterval(refreshTimer);
  }

  refreshButton.disabled = true;

  refreshingThread = true;

  localRequest(refreshURL, refreshCallback);

}

function sendReplyData(files, captchaId) {

  var forcedAnon = !document.getElementById('fieldName');
  var hiddenFlags = !document.getElementById('flagsDiv');

  if (!hiddenFlags) {
    var combo = document.getElementById('flagCombobox');

    var selectedFlag = combo.options[combo.selectedIndex].value;

    savedSelectedFlag(selectedFlag);

  }

  if (!forcedAnon) {
    var typedName = document.getElementById('fieldName').value.trim();
    localStorage.setItem('name', typedName);
  }

  var typedEmail = document.getElementById('fieldEmail').value.trim();
  var typedMessage = document.getElementById('fieldMessage').value.trim();
  var typedSubject = document.getElementById('fieldSubject').value.trim();
  var typedPassword = document.getElementById('fieldPostingPassword').value
      .trim();

  var threadId = document.getElementById('threadIdentifier').value;

  if (!typedMessage.length && !files.length) {
    alert('A message or a file is mandatory.');
    return;
  } else if (!forcedAnon && typedName.length > 32) {
    alert('Name is too long, keep it under 32 characters.');
    return;
  } else if (typedMessage.length > messageLimit) {
    alert('Message is too long, keep it under ' + messageLimit + ' characters.');
    return;
  } else if (typedEmail.length > 64) {
    alert('E-mail is too long, keep it under 64 characters.');
    return;
  } else if (typedSubject.length > 128) {
    alert('Subject is too long, keep it under 128 characters.');
    return;
  } else if (typedPassword.length > 8) {
    alert('Password is too long, keep it under 8 characters.');
    return;
  }

  if (!typedPassword) {
    typedPassword = Math.random().toString(36).substring(2, 10);
  }

  localStorage.setItem('deletionPassword', typedPassword);

  var spoilerCheckBox = document.getElementById('checkboxSpoiler');

  var noFlagCheckBox = document.getElementById('checkboxNoFlag');

  originalButtonText = replyButton.innerHTML;
  replyButton.innerHTML = 'Uploading 0%';
  setQRReplyText(replyButton.innerHTML);
  replyButton.disabled = true;
  setQRReplyEnabled(false);

  apiRequest('replyThread', {
    name : forcedAnon ? null : typedName,
    flag : hiddenFlags ? null : selectedFlag,
    captcha : captchaId,
    subject : typedSubject,
    noFlag : noFlagCheckBox ? noFlagCheckBox.checked : false,
    spoiler : spoilerCheckBox ? spoilerCheckBox.checked : false,
    password : typedPassword,
    message : typedMessage,
    email : typedEmail,
    files : files,
    boardUri : boardUri,
    threadId : threadId
  }, replyCallback);

}

function processFilesToPost(captchaId) {

  getFilestToUpload(function gotFiles(files) {
    sendReplyData(files, captchaId);
  });

}

function processReplyRequest() {

  if (hiddenCaptcha) {
    processFilesToPost();
  } else {
    var typedCaptcha = document.getElementById('fieldCaptcha').value.trim();

    if (typedCaptcha.length !== 6 && typedCaptcha.length !== 24) {
      alert('Captchas are exactly 6 (24 if no cookies) characters long.');
      return;
    } else if (/\W/.test(typedCaptcha)) {
      alert('Invalid captcha.');
      return;
    }

    if (typedCaptcha.length == 24) {
      processFilesToPost(typedCaptcha);
    } else {
      var parsedCookies = getCookies();

      apiRequest('solveCaptcha', {

        captchaId : parsedCookies.captchaid,
        answer : typedCaptcha
      }, function solvedCaptcha(status, data) {
        processFilesToPost(parsedCookies.captchaid);
      });
    }

  }

}

function postReply() {

  localRequest('/blockBypass.js?json=1',
      function checked(error, response) {

        if (error) {
          alert(error);
          return;
        }

        var data = JSON.parse(response);

        var alwaysUseBypass = document
            .getElementById('alwaysUseBypassCheckBox').checked;

        if (!data.valid
            && (data.mode == 2 || (data.mode == 1 && alwaysUseBypass))) {

          displayBlockBypassPrompt(function() {
            processReplyRequest();
          });

        } else {
          processReplyRequest();
        }

      });

}

function startTimer(time) {

  if (time > limitRefreshWait) {
    time = limitRefreshWait;
  }

  currentRefresh = time;
  lastRefresh = time;
  refreshLabel.innerHTML = currentRefresh;
  refreshTimer = setInterval(function checkTimer() {

    if (loadingThread) {
      return;
    }

    currentRefresh--;

    if (!currentRefresh) {
      clearInterval(refreshTimer);
      refreshPosts();
      refreshLabel.innerHTML = '';
    } else {
      refreshLabel.innerHTML = currentRefresh;
    }

  }, 1000);
}

function changeRefresh() {

  autoRefresh = document.getElementById('checkboxChangeRefresh').checked;

  if (!autoRefresh) {
    refreshLabel.innerHTML = '';
    clearInterval(refreshTimer);
  } else {
    startTimer(5);
  }

}

function deleteFromIp() {

  var typedIp = document.getElementById('ipField').value.trim();
  var typedBoards = document.getElementById('fieldBoards').value.trim();

  if (!typedIp.length) {
    alert('An ip is mandatory');
    return;
  }

  apiRequest('deleteFromIp', {
    ip : typedIp,
    boards : typedBoards
  }, function requestComplete(status, data) {

    if (status === 'ok') {

      document.getElementById('ipField').value = '';
      document.getElementById('fieldBoards').value = '';

      alert('Postings deleted.');

    } else {
      alert(status + ': ' + JSON.stringify(data));
    }
  });

}
