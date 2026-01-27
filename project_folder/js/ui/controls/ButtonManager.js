// js/ui/controls/ButtonManager.js
class ButtonManager {
    static createButton(id, text, className, onClick) {
        const button = document.createElement('button');
        button.id = id;
        button.textContent = text;
        button.className = `btn ${className}`;
        button.addEventListener('click', onClick);
        return button;
    }

    static createIconButton(id, icon, text, className, onClick) {
        const button = document.createElement('button');
        button.id = id;
        button.innerHTML = `${icon} ${text}`;
        button.className = `btn ${className}`;
        button.addEventListener('click', onClick);
        return button;
    }

    static createPrimaryButton(id, text, onClick) {
        return this.createButton(id, text, 'btn-primary', onClick);
    }

    static createDangerButton(id, text, onClick) {
        return this.createButton(id, text, 'btn-danger', onClick);
    }

    static createSuccessButton(id, text, onClick) {
        return this.createButton(id, text, 'btn-success', onClick);
    }

    static disableButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = true;
            button.classList.add('disabled');
        }
    }

    static enableButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = false;
            button.classList.remove('disabled');
        }
    }
}

export default ButtonManager;