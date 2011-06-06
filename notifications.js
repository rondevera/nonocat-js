/*global alert, console */

(function(w, d){
  var Utils   = {},
      DOM     = {},
      Network = {},
      Nonocat = {};



  /*** Utils ***/

  Utils.arrayContainsArray = function(bigArray, smallArray){
    // Returns `true` if all elements in `smallArray` can be found in
    // `bigArray`.

    var isContained = true,
        i = smallArray.length;

    while(isContained && i--){
      isContained = (bigArray.indexOf(smallArray[i]) >= 0);
    }

    return isContained;
  };



  /*** DOM ***/

  DOM.elementHasClassNames = function(elem, classNames){
    var elemClassName = elem.className;
    return  !!elemClassName &&
            Utils.arrayContainsArray(
              classNames, elemClassName.split(/\s+/));
  };

  DOM.getElementsByClassNames = function(classNames, rootElem, stack){
    if(!rootElem){ rootElem = d.body; }

    // Use native selector engine, if any
    if(rootElem.querySelectorAll){
      return rootElem.querySelectorAll('.' + classNames.join('.'));
    }

    var matches = [],
        elem    = rootElem;

    if(!stack){
      stack = [rootElem]; // Initialize stack; contains elements to be checked
    }else if(!stack[0]){
      return matches;     // Emptied stack; done
    }

    // Check current element
    if(DOM.elementHasClassNames(rootElem, classNames)){
      matches.push(rootElem);
    }

    // Add immediate children to stack
    if(elem.firstElementChild){
      // Add first child
      elem = elem.firstElementChild;
      stack.push(elem);

      // Add subsequent children
      elem = elem.nextElementSibling;
      while(elem){ // or: `while(elem = elem.nextElementSibling)`
        stack.push(elem);
        elem = elem.nextElementSibling;
      }
    }

    // Recurse on the stack's top element
    matches = matches.concat(
      DOM.getElementsByClassNames(classNames, stack.pop(), stack));

    return matches;
  };

  DOM.getElementsByClassName = function(className, rootElem){
    return DOM.getElementsByClassNames([className], rootElem || d.body);
  };

  DOM.removeElementClassName = function(elem, className){
    elem.className = elem.className.
      replace(new RegExp('(^|\\s+)' + className + '(\\s+|$)'), ' ').trim();
  };



  /*** Network ***/

  Network.sendAjaxRequest = function(url, options){
    // `options`:
    // - onSuccess:   <function(xhr)>
    // - onError:     <function(xhr)>
    // - onComplete:  <function(xhr)>
    // - data:        String to post: 'key1=value1&key2=value2&...'
    // - method:      'GET' or 'POST'

    var request,
        method      = options.method || 'GET',
        isAsync     = true,
        data        = options.data || '',
        noop        = function(){},
        hasCallback = !!( options.onSuccess ||
                          options.onError ||
                          options.onComplete);

    if(w.XMLHttpRequest){
      request = new XMLHttpRequest();
    }else{
      alert('There was a problem with sending the Ajax request.');
    }

    if(hasCallback){
      request.onreadystatechange = function(){
        if(request.readyState === 4){
          if(request.status === 200){
            (options.onSuccess || noop)(request);
          }else{
            (options.onError || noop)(request);
          }

          (options.onComplete || noop)(request);
        }
      };
    }

    request.open(method, url, isAsync);
    request.send(data);
  };



  /*** Nonocat ***/

  Nonocat.markNotificationAsRead = function(notifElem){
    var subject = DOM.getElementsByClassName('subject', notifElem)[0],
        notifId;

    if(!subject){
      console.log('No subject found.');
      return;
    }

    try{
      notifId = subject.href.match(/\?_nid=(\d+)(#.*)?$/)[1];
      console.log('Marking notification #' + notifId + ' as read...');
    }catch(err){
      alert("Couldn't find notification ID.");
      return;
    }

    // Mark notification as unread
    Network.sendAjaxRequest('https://github.com/?_nid=' + notifId, {
      onSuccess: function(xhr){
        DOM.removeElementClassName(notifElem, 'unread');
        console.log('Marked as read: notification #' + notifId);
      },
      onError: function(xhr){
        alert('There was a problem marking this notification as read.');
      }
    });
  };

  Nonocat.onNotificationDblclick = function(ev){
    Nonocat.markNotificationAsRead(this);
    ev.preventDefault();
  };



  // Enable double-clicking notifications to mark them as read
  (function(){
    var notifs, notif, i;

    // Find notifications
    notifs = DOM.getElementsByClassNames(['item', 'unread']);
    if(!notifs[0]){
      alert('No notifications found.');
      return;
    }

    i = notifs.length;
    while(i--){
      notif = notifs[i];
      if(notif.addEventListener){
        notif.addEventListener(
          'dblclick', Nonocat.onNotificationDblclick, false);
      }else{
        alert("Couldn't bind the double-click handler.");
      }
    }
  }());
}(window, document));
