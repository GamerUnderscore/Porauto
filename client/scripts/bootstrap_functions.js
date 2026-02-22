function createModal(title, data) {
    const modal = document.createElement('div');
    modal.classList.add('modal');

    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content');

    const modalHeader = document.createElement('div');
    modalHeader.classList.add('modal-header');

    const modalTitle = document.createElement('h2');
    modalTitle.textContent = title;

    const closeButton = document.createElement('span');
    closeButton.classList.add('close-button');
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => {
        document.body.removeChild(modal);
    };

    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);

    const modalBody = document.createElement('div');
    modalBody.classList.add('modal-body');

    data.forEach(item => {
        const itemElement = document.createElement('p');
        itemElement.textContent = item;
        modalBody.appendChild(itemElement);
    });

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);

    document.body.appendChild(modal);
}

