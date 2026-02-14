const container = document.querySelector('#table');
const contextMenuSettings = {
    callback(key, selection, clickEvent) {
        console.log(key, selection, clickEvent);
    },
    items: {
        about: {
            name() {
                return 'Déplacer';
            },
            hidden() {
                return this.getSelectedLast()?.[0] - this.getSelectedLast()?.[2] != 0;
            },
            callback() {
                setTimeout(() => {
                    const cell = this.getSelectedLast();
                    const id = this.getDataAtCell(cell[0], 0);


                    $('#requestPosition').modal('show')


                    planMove(id);
                }, 1);
            },
        },
    },
};
const hot = new Handsontable(container, {

    themeName: 'ht-theme-main-dark-auto',
    data: [],
    stretchH: 'all',
    height: 'auto',
    colHeaders: ['ID', 'Position', 'Hauteur', 'Companie', 'Date d\'arrivée', 'Date de départ', 'Destination', 'Statut', 'Description'],
    licenseKey: 'non-commercial-and-evaluation',
    columns: [
        {
            data: 'id',
            editor: false,
            readOnly: true,
        },
        {
            data: 'position',
            editor: 'text',
            readOnly: true,
        },
        {
            data: 'hauteur',
            editor: 'text',
            readOnly: true,
        },
        {
            data: 'company',
            editor: 'text',
        },
        {
            data: 'arrivalDate',
            type: 'date',
            dateFormat: 'DD/MM/YYYY',
            correctFormat: true,
            defaultDate: '01/01/2024',
        },
        {
            data: 'departureDate',
            type: 'date',
            dateFormat: 'DD/MM/YYYY',
            correctFormat: true,
            defaultDate: '01/01/2024',
        },
        {
            data: 'destination',
            editor: 'text',
        },
        {
            data: 'status',
            editor: 'text',
        },
        {
            data: 'description',
            editor: 'text',
        },
    ],
    autoWrapRow: true,
    autoWrapCol: true,
    contextMenu: true,
    licenseKey: 'non-commercial-and-evaluation', // for non-commercial use only
    contextMenu: contextMenuSettings,
    afterChange: function (changes, source) {
        if (source === 'loadData' || !changes) return; // Ignore changes caused by loadData or if there are no changes
        sendTableDataToServer();
    }
});