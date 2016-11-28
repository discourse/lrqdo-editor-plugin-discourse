define("medium-editor-autocomplete", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var last;

  var LEFT_ARROW_KEYCODE = 37;

  exports.LEFT_ARROW_KEYCODE = LEFT_ARROW_KEYCODE;
  last = function (text) {
    return text[text.length - 1];
  };

  var unwrapForTextNode = function unwrapForTextNode(el, doc) {
    var currentNode, parentNode, prevNode, results;
    parentNode = el.parentNode;
    MediumEditor.util.unwrap(el, doc);
    currentNode = parentNode.lastChild;
    prevNode = currentNode.previousSibling;
    results = [];
    while (prevNode) {
      if (currentNode.nodeType === 3 && prevNode.nodeType === 3) {
        prevNode.textContent += currentNode.textContent;
        parentNode.removeChild(currentNode);
      }
      currentNode = prevNode;
      results.push(prevNode = currentNode.previousSibling);
    }
    return results;
  };

  exports.unwrapForTextNode = unwrapForTextNode;
  var TCMention = MediumEditor.Extension.extend({
    name: "mention",
    extraClassName: "",
    extraActiveClassName: "",
    extraPanelClassName: "",
    extraActivePanelClassName: "",
    extraTriggerClassNameMap: {},
    extraActiveTriggerClassNameMap: {},
    tagName: "strong",
    renderPanelContent: function renderPanelContent() {},
    destroyPanelContent: function destroyPanelContent() {},
    htmlNode: false,
    activeTriggerList: ["@"],
    triggerClassNameMap: {
      "#": "medium-editor-mention-hash",
      "@": "medium-editor-mention-at"
    },
    activeTriggerClassNameMap: {
      "#": "medium-editor-mention-hash-active",
      "@": "medium-editor-mention-at-active"
    },
    hideOnBlurDelay: 300,
    init: function init() {
      this.initMentionPanel();
      return this.attachEventHandlers();
    },
    destroy: function destroy() {
      this.detachEventHandlers();
      return this.destroyMentionPanel();
    },
    initMentionPanel: function initMentionPanel() {
      var el;
      el = this.document.createElement("div");
      el.classList.add("medium-editor-mention-panel");
      if (this.extraPanelClassName || this.extraClassName) {
        el.classList.add(this.extraPanelClassName || this.extraClassName);
      }
      this.getEditorOption("elementsContainer").appendChild(el);
      return this.mentionPanel = el;
    },
    destroyMentionPanel: function destroyMentionPanel() {
      if (this.mentionPanel) {
        if (this.mentionPanel.parentNode) {
          this.destroyPanelContent(this.mentionPanel);
          this.mentionPanel.parentNode.removeChild(this.mentionPanel);
        }
        return delete this.mentionPanel;
      }
    },
    attachEventHandlers: function attachEventHandlers() {
      var subscribeCallbackName;
      this.unsubscribeCallbacks = [];
      subscribeCallbackName = (function (_this) {
        return function (eventName, callbackName) {
          var boundCallback;
          boundCallback = _this[callbackName].bind(_this);
          _this.subscribe(eventName, boundCallback);
          return _this.unsubscribeCallbacks.push(function () {
            return _this.base.unsubscribe(eventName, boundCallback);
          });
        };
      })(this);
      if (this.hideOnBlurDelay !== null && this.hideOnBlurDelay !== void 0) {
        subscribeCallbackName("blur", "handleBlur");
        subscribeCallbackName("focus", "handleFocus");
      }
      return subscribeCallbackName("editableKeyup", "handleKeyup");
    },
    detachEventHandlers: function detachEventHandlers() {
      var boundCallback;
      if (this.hideOnBlurDelayId) {
        clearTimeout(this.hideOnBlurDelayId);
      }
      if (this.unsubscribeCallbacks) {
        this.unsubscribeCallbacks.forEach(boundCallback = (function (_this) {
          return function () {
            return boundCallback();
          };
        })(this));
        return this.unsubscribeCallbacks = null;
      }
    },
    handleBlur: function handleBlur() {
      if (this.hideOnBlurDelay !== null && this.hideOnBlurDelay !== void 0) {
        return this.hideOnBlurDelayId = setTimeout((function (_this) {
          return function () {
            return _this.hidePanel(false);
          };
        })(this), this.hideOnBlurDelay);
      }
    },
    handleFocus: function handleFocus() {
      if (this.hideOnBlurDelayId) {
        clearTimeout(this.hideOnBlurDelayId);
        return this.hideOnBlurDelayId = null;
      }
    },
    handleKeyup: function handleKeyup(event) {
      var isSpace, keyCode;
      keyCode = MediumEditor.util.getKeyCode(event);
      isSpace = keyCode === MediumEditor.util.keyCode.SPACE;
      this.getWordFromSelection(event.target, isSpace != null ? isSpace : -{
        1: 0
      });
      if (!isSpace && this.activeTriggerList.indexOf(this.trigger) !== -1 && this.word.length > 1) {
        return this.showPanel();
      } else {
        return this.hidePanel(keyCode === LEFT_ARROW_KEYCODE);
      }
    },
    hidePanel: function hidePanel(isArrowTowardsLeft) {
      var extraActivePanelClassName, firstChild, hasLastEmptyWord, lastEmptyWord, nextSibling, parentNode, previousSibling, ref, siblingNode, textContent, textNode;
      this.mentionPanel.classList.remove("medium-editor-mention-panel-active");
      extraActivePanelClassName = this.extraActivePanelClassName || this.extraActiveClassName;
      if (extraActivePanelClassName) {
        this.mentionPanel.classList.remove(extraActivePanelClassName);
      }
      if (this.activeMentionAt) {
        this.activeMentionAt.classList.remove(this.activeTriggerClassName);
        if (this.extraActiveTriggerClassName) {
          this.activeMentionAt.classList.remove(this.extraActiveTriggerClassName);
        }
      }
      if (this.activeMentionAt) {
        ref = this.activeMentionAt, parentNode = ref.parentNode, previousSibling = ref.previousSibling, nextSibling = ref.nextSibling, firstChild = ref.firstChild;
        siblingNode = isArrowTowardsLeft ? previousSibling : nextSibling;
        if (!siblingNode) {
          textNode = this.document.createTextNode("");
          parentNode.appendChild(textNode);
        } else if (siblingNode.nodeType !== 3) {
          textNode = this.document.createTextNode("");
          parentNode.insertBefore(textNode, siblingNode);
        } else {
          textNode = siblingNode;
        }
        lastEmptyWord = last(firstChild.textContent);
        hasLastEmptyWord = lastEmptyWord.trim().length === 0;
        if (hasLastEmptyWord) {
          textContent = firstChild.textContent;
          firstChild.textContent = textContent.substr(0, textContent.length - 1);
          textNode.textContent = "" + lastEmptyWord + textNode.textContent;
        } else {
          if (textNode.textContent.length === 0 && firstChild.textContent.length > 1) {
            textNode.textContent = " ";
          }
        }
        if (isArrowTowardsLeft) {
          MediumEditor.selection.select(this.document, textNode, textNode.length);
        } else {
          MediumEditor.selection.select(this.document, textNode, Math.min(textNode.length, 1));
        }
        if (firstChild.textContent.length <= 1) {
          this.base.saveSelection();
          unwrapForTextNode(this.activeMentionAt, this.document);
          this.base.restoreSelection();
        }
        return this.activeMentionAt = null;
      }
    },
    getWordFromSelection: function getWordFromSelection(target, initialDiff) {
      var endContainer, getWordPosition, ref, startContainer, startOffset, textContent;
      ref = MediumEditor.selection.getSelectionRange(this.document), startContainer = ref.startContainer, startOffset = ref.startOffset, endContainer = ref.endContainer;
      if (startContainer !== endContainer) {
        return;
      }
      textContent = startContainer.textContent;
      getWordPosition = function (position, diff) {
        var prevText;
        prevText = textContent[position - 1];
        if (prevText === null || prevText === void 0) {
          return position;
        } else if (prevText.trim().length === 0 || position <= 0 || textContent.length < position) {
          return position;
        } else {
          return getWordPosition(position + diff, diff);
        }
      };
      this.wordStart = getWordPosition(startOffset + initialDiff, -1);
      this.wordEnd = getWordPosition(startOffset + initialDiff, 1) - 1;
      this.word = textContent.slice(this.wordStart, this.wordEnd);
      this.trigger = this.word.slice(0, 1);
      this.triggerClassName = this.triggerClassNameMap[this.trigger];
      this.activeTriggerClassName = this.activeTriggerClassNameMap[this.trigger];
      this.extraTriggerClassName = this.extraTriggerClassNameMap[this.trigger];
      return this.extraActiveTriggerClassName = this.extraActiveTriggerClassNameMap[this.trigger];
    },
    showPanel: function showPanel() {
      if (!this.mentionPanel.classList.contains("medium-editor-mention-panel-active")) {
        this.activatePanel();
        this.wrapWordInMentionAt();
      }
      this.positionPanel();
      return this.updatePanelContent();
    },
    activatePanel: function activatePanel() {
      this.mentionPanel.classList.add("medium-editor-mention-panel-active");
      if (this.extraActivePanelClassName || this.extraActiveClassName) {
        return this.mentionPanel.classList.add(this.extraActivePanelClassName || this.extraActiveClassName);
      }
    },
    wrapWordInMentionAt: function wrapWordInMentionAt() {
      var element, nextWordEnd, range, selection;
      selection = this.document.getSelection();
      if (!selection.rangeCount) {
        return;
      }
      range = selection.getRangeAt(0).cloneRange();
      if (range.startContainer.parentNode.classList.contains(this.triggerClassName)) {
        this.activeMentionAt = range.startContainer.parentNode;
      } else {
        nextWordEnd = Math.min(this.wordEnd, range.startContainer.textContent.length);
        range.setStart(range.startContainer, this.wordStart);
        range.setEnd(range.startContainer, nextWordEnd);
        element = this.document.createElement(this.tagName);
        element.classList.add(this.triggerClassName);
        if (this.extraTriggerClassName) {
          element.classList.add(this.extraTriggerClassName);
        }
        this.activeMentionAt = element;
        range.surroundContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
        MediumEditor.selection.select(this.document, this.activeMentionAt.firstChild, this.word.length);
      }
      this.activeMentionAt.classList.add(this.activeTriggerClassName);
      if (this.extraActiveTriggerClassName) {
        return this.activeMentionAt.classList.add(this.extraActiveTriggerClassName);
      }
    },
    positionPanel: function positionPanel() {
      var bottom, left, pageXOffset, pageYOffset, ref, ref1, width;
      ref = this.activeMentionAt.getBoundingClientRect(), bottom = ref.bottom, left = ref.left, width = ref.width;
      ref1 = this.window, pageXOffset = ref1.pageXOffset, pageYOffset = ref1.pageYOffset;
      this.mentionPanel.style.top = pageYOffset + bottom + "px";
      return this.mentionPanel.style.left = pageXOffset + left + width + "px";
    },
    updatePanelContent: function updatePanelContent() {
      return this.renderPanelContent(this.mentionPanel, this.word, this.handleSelectMention.bind(this));
    },
    handleSelectMention: function handleSelectMention(seletedText) {
      var target, textNode;
      if (seletedText) {
        if (this.htmlNode) {
          this.activeMentionAt.innerHTML = seletedText;
        } else {
          textNode = this.activeMentionAt.firstChild;
          textNode.textContent = seletedText;
          MediumEditor.selection.select(this.document, textNode, seletedText.length);
        }
        target = this.base.getFocusedElement();
        if (target) {
          this.base.events.updateInput(target, {
            target: target,
            currentTarget: target
          });
        }
        return this.hidePanel(false);
      } else {
        return this.hidePanel(false);
      }
    }
  });

  exports.TCMention = TCMention;
  exports["default"] = TCMention;
});
