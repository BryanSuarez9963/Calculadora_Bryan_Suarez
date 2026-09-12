(() => {
    'use strict';

    const MAX_INPUT_LENGTH = 15;
    const OPERATOR_SYMBOLS = {
        '+': '+',
        '-': '−',
        '*': '×',
        '/': '÷'
    };

    const display = document.getElementById('display');
    const displaySection = document.querySelector('.display-section');
    const preview = document.getElementById('calculation-preview');
    const feedback = document.getElementById('calculator-feedback');
    const keypad = document.querySelector('.keypad');
    const operatorButtons = [...document.querySelectorAll('[data-operator]')];

    let firstOperand = null;
    let operator = null;
    let waitingForOperand = false;
    let hasError = false;

    function updateDisplay(value) {
        display.value = String(value);
        display.classList.toggle('is-compact', display.value.length > 11);
    }

    function setFeedback(message, isError = false) {
        feedback.textContent = message;
        displaySection.classList.toggle('is-error', isError);
        display.classList.toggle('is-error', isError);
    }

    function setSelectedOperator(selectedOperator) {
        operatorButtons.forEach((button) => {
            const isSelected = button.dataset.operator === selectedOperator;
            button.classList.toggle('is-selected', isSelected);
            button.setAttribute('aria-pressed', String(isSelected));
        });
    }

    function clearErrorForInput() {
        if (!hasError) return;
        clearCalculator();
    }

    function inputNumber(value) {
        clearErrorForInput();

        if (waitingForOperand) {
            updateDisplay(value === '.' ? '0.' : value);
            waitingForOperand = false;
            setFeedback('Ingresa el segundo valor');
            return;
        }

        if (value === '.') {
            if (display.value.includes('.')) return;
            updateDisplay(display.value === '0' ? '0.' : `${display.value}.`);
            return;
        }

        const digitCount = display.value.replace(/[-.]/g, '').length;
        if (digitCount >= MAX_INPUT_LENGTH) {
            setFeedback(`Máximo ${MAX_INPUT_LENGTH} dígitos`);
            return;
        }

        updateDisplay(display.value === '0' ? value : `${display.value}${value}`);
        setFeedback('Selecciona una operación');
    }

    function formatResult(value) {
        if (!Number.isFinite(value)) {
            throw new Error('El resultado es demasiado grande');
        }

        if (Object.is(value, -0)) return '0';
        return Number.parseFloat(value.toPrecision(12)).toString();
    }

    function performCalculation(left, right, selectedOperator) {
        switch (selectedOperator) {
            case '+':
                return left + right;
            case '-':
                return left - right;
            case '*':
                return left * right;
            case '/':
                if (right === 0) {
                    throw new Error('No se puede dividir entre cero');
                }
                return left / right;
            default:
                throw new Error('Operación no válida');
        }
    }

    function showError(message) {
        hasError = true;
        firstOperand = null;
        operator = null;
        waitingForOperand = true;
        updateDisplay('Error');
        preview.textContent = 'Operación no completada';
        setSelectedOperator(null);
        setFeedback(message, true);
    }

    function chooseOperator(nextOperator) {
        if (hasError) return;

        const inputValue = Number(display.value);
        if (!Number.isFinite(inputValue)) {
            showError('El valor ingresado no es válido');
            return;
        }

        if (operator && waitingForOperand) {
            operator = nextOperator;
            preview.textContent = `${display.value} ${OPERATOR_SYMBOLS[operator]}`;
            setSelectedOperator(operator);
            setFeedback('Operador actualizado');
            return;
        }

        if (firstOperand === null) {
            firstOperand = inputValue;
        } else if (operator) {
            try {
                const result = performCalculation(firstOperand, inputValue, operator);
                const formattedResult = formatResult(result);
                updateDisplay(formattedResult);
                firstOperand = Number(formattedResult);
            } catch (error) {
                showError(error.message);
                return;
            }
        }

        operator = nextOperator;
        waitingForOperand = true;
        preview.textContent = `${display.value} ${OPERATOR_SYMBOLS[operator]}`;
        setSelectedOperator(operator);
        setFeedback('Ingresa el segundo valor');
    }

    function calculateResult() {
        if (hasError || operator === null || firstOperand === null || waitingForOperand) {
            if (!hasError) setFeedback('Completa la operación antes de calcular');
            return;
        }

        const secondOperand = Number(display.value);
        const expression = `${formatResult(firstOperand)} ${OPERATOR_SYMBOLS[operator]} ${display.value}`;

        try {
            const result = performCalculation(firstOperand, secondOperand, operator);
            updateDisplay(formatResult(result));
            preview.textContent = `${expression} =`;
            setFeedback('Resultado calculado');
            firstOperand = null;
            operator = null;
            waitingForOperand = true;
            setSelectedOperator(null);
        } catch (error) {
            showError(error.message);
        }
    }

    function clearCalculator() {
        firstOperand = null;
        operator = null;
        waitingForOperand = false;
        hasError = false;
        updateDisplay('0');
        preview.textContent = 'Operación básica';
        setSelectedOperator(null);
        setFeedback('Selecciona un número para comenzar');
    }

    function deleteLastDigit() {
        if (hasError) {
            clearCalculator();
            return;
        }

        if (waitingForOperand) return;

        const nextValue = display.value.length > 1 ? display.value.slice(0, -1) : '0';
        updateDisplay(nextValue === '-' ? '0' : nextValue);
        setFeedback('Último dígito eliminado');
    }

    function animateKeyboardButton(selector) {
        const button = document.querySelector(selector);
        if (!button) return;

        button.classList.add('is-keyboard-active');
        window.setTimeout(() => button.classList.remove('is-keyboard-active'), 100);
    }

    keypad.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        if (button.dataset.number !== undefined) {
            inputNumber(button.dataset.number);
        } else if (button.dataset.operator) {
            chooseOperator(button.dataset.operator);
        } else if (button.dataset.action === 'equals') {
            calculateResult();
        } else if (button.dataset.action === 'clear') {
            clearCalculator();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (/^[0-9.]$/.test(event.key)) {
            event.preventDefault();
            inputNumber(event.key);
            animateKeyboardButton(`[data-number="${event.key}"]`);
            return;
        }

        if (['+', '-', '*', '/'].includes(event.key)) {
            event.preventDefault();
            chooseOperator(event.key);
            animateKeyboardButton(`[data-operator="${event.key}"]`);
            return;
        }

        if (event.key === 'Enter' || event.key === '=') {
            event.preventDefault();
            calculateResult();
            animateKeyboardButton('[data-action="equals"]');
        } else if (event.key === 'Escape' || event.key.toLowerCase() === 'c') {
            event.preventDefault();
            clearCalculator();
            animateKeyboardButton('[data-action="clear"]');
        } else if (event.key === 'Backspace' || event.key === 'Delete') {
            event.preventDefault();
            deleteLastDigit();
        }
    });

    clearCalculator();
})();
