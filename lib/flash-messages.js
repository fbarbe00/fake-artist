// Simple flash messages replacement for mrt:flash-messages
if (Meteor.isClient) {
  const FlashMessages = {
    messages: [],
    config: {
      autoHide: true,
      autoScroll: false
    },

    configure(options) {
      Object.assign(this.config, options);
    },

    sendError(message) {
      this._addMessage(message, 'error');
    },

    sendSuccess(message) {
      this._addMessage(message, 'success');
    },

    sendWarning(message) {
      this._addMessage(message, 'warning');
    },

    sendInfo(message) {
      this._addMessage(message, 'info');
    },

    _addMessage(message, type) {
      const msgObj = {
        message,
        type,
        id: Math.random().toString(36).substr(2, 9)
      };

      this.messages.push(msgObj);
      this._displayMessage(msgObj);

      if (this.config.autoHide) {
        setTimeout(() => {
          this._removeMessage(msgObj.id);
        }, 5000);
      }
    },

    _displayMessage(msgObj) {
      // Create a simple notification div
      const notif = document.createElement('div');
      notif.id = `flash-${msgObj.id}`;
      notif.className = `flash-message flash-${msgObj.type}`;
      notif.textContent = msgObj.message;
      notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${this._getBackgroundColor(msgObj.type)};
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 9999;
        max-width: 400px;
      `;

      document.body.appendChild(notif);
    },

    _removeMessage(id) {
      const elem = document.getElementById(`flash-${id}`);
      if (elem) {
        elem.remove();
      }
      this.messages = this.messages.filter(m => m.id !== id);
    },

    _getBackgroundColor(type) {
      const colors = {
        error: '#dc3545',
        success: '#28a745',
        warning: '#ffc107',
        info: '#17a2b8'
      };
      return colors[type] || '#17a2b8';
    },

    clear() {
      this.messages.forEach(msg => {
        this._removeMessage(msg.id);
      });
    }
  };

  window.FlashMessages = FlashMessages;
}
