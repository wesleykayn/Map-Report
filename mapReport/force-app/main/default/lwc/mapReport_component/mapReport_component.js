import { LightningElement, wire, track } from 'lwc';
import getAccounts from '@salesforce/apex/MapReportController.getAccounts';
import getLeads from '@salesforce/apex/MapReportController.getLeads';
import getOpportunities from '@salesforce/apex/MapReportController.getOpportunities';

export default class MapReportComponent extends LightningElement {
    selectedObject = 'Account';

    @track isModalOpen = false;
    @track modalRecord = {};
    @track modalObjectType = '';

    // ---------------- MAP MARKERS ----------------
    mapMarkers = [
        {
            location: { Latitude: 31.5204, Longitude: 74.3587 },
            title: 'Center',
            description: 'Map center marker'
        }
    ];

    // ---------------- ACCOUNT TABLE ----------------
    @track accountColumns = [
        {
            label: 'Account Name',
            fieldName: 'AccountUrl',
            type: 'url',
            typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' }
        },
        { label: 'Industry', fieldName: 'Industry', type: 'text' },
        {
            label: 'Opportunities',
            fieldName: 'OpportunityUrls',
            type: 'url',
            typeAttributes: { label: { fieldName: 'OpportunityNames' }, target: '_blank' }
        },
        { label: 'Address', fieldName: 'Address', type: 'text' },
        { label: 'Owner', fieldName: 'OwnerName', type: 'text' },
        {
            type: 'button-icon',
            fixedWidth: 50,
            typeAttributes: {
                iconName: 'utility:edit',
                title: 'Edit',
                variant: 'bare',
                alternativeText: 'Edit',
                name: 'edit'
            }
        }
    ];
    @track accountData = [];

    @wire(getAccounts)
    wiredAccounts({ error, data }) {
        if (data) {
            this.accountData = data.map(acc => {
                let firstOpportunity = null;
                if (acc.Opportunities && acc.Opportunities.length > 0) {
                    firstOpportunity = {
                        url: `/lightning/r/Opportunity/${acc.Opportunities[0].Id}/view`,
                        name: acc.Opportunities[0].Name
                    };
                }
                return {
                    Id: acc.Id,
                    Name: acc.Name,
                    Industry: acc.Industry,
                    AccountUrl: `/lightning/r/Account/${acc.Id}/view`,
                    OpportunityUrls: firstOpportunity ? firstOpportunity.url : null,
                    OpportunityNames: firstOpportunity ? firstOpportunity.name : '—',
                    Address: `${acc.BillingStreet || ''} ${acc.BillingCity || ''} ${acc.BillingState || ''} ${acc.BillingCountry || ''}`,
                    OwnerName: acc.Owner ? acc.Owner.Name : ''
                };
            });
        } else if (error) {
            console.error('Error fetching accounts', error);
        }
    }

    // ---------------- LEAD TABLE ----------------
    @track leadColumns = [
        { label: 'Lead Name', fieldName: 'LeadUrl', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' } },
        { label: 'Company', fieldName: 'Company' },
        { label: 'Status', fieldName: 'Status' },
        { label: 'Owner', fieldName: 'OwnerName' },
        { label: 'Address', fieldName: 'Address' },
        {
            type: 'button-icon',
            fixedWidth: 50,
            typeAttributes: {
                iconName: 'utility:edit',
                title: 'Edit',
                variant: 'bare',
                alternativeText: 'Edit',
                name: 'edit'
            }
        }
    ];
    @track leadData = [];

    @wire(getLeads)
    wiredLeads({ error, data }) {
        if (data) {
            this.leadData = data.map(ld => {
                return {
                    Id: ld.Id,
                    Name: ld.Name,
                    Company: ld.Company,
                    Status: ld.Status,
                    LeadUrl: `/lightning/r/Lead/${ld.Id}/view`,
                    OwnerName: ld.Owner ? ld.Owner.Name : '',
                    Address: `${ld.Street || ''} ${ld.City || ''} ${ld.State || ''} ${ld.Country || ''}`
                };
            });
        } else if (error) {
            console.error('Error fetching leads', error);
        }
    }

    // ---------------- OPPORTUNITY TABLE ----------------
    @track opportunityColumns = [
        { label: 'Opportunity Name', fieldName: 'OpportunityUrl', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' } },
        { label: 'Account Name', fieldName: 'AccountUrl', type: 'url', typeAttributes: { label: { fieldName: 'AccountName' }, target: '_blank' } },
        { label: 'Stage', fieldName: 'StageName' },
        { label: 'Amount', fieldName: 'Amount', type: 'currency' },
        { label: 'Address', fieldName: 'Address' },
        {
            type: 'button-icon',
            fixedWidth: 50,
            typeAttributes: {
                iconName: 'utility:edit',
                title: 'Edit',
                variant: 'bare',
                alternativeText: 'Edit',
                name: 'edit'
            }
        }
    ];
    @track opportunityData = [];

    @wire(getOpportunities)
    wiredOpportunities({ error, data }) {
        if (data) {
            this.opportunityData = data.map(op => {
                return {
                    Id: op.Id,
                    Name: op.Name,
                    StageName: op.StageName,
                    Amount: op.Amount,
                    OpportunityUrl: `/lightning/r/Opportunity/${op.Id}/view`,
                    AccountName: op.Account ? op.Account.Name : '',
                    AccountUrl: op.Account ? `/lightning/r/Account/${op.Account.Id}/view` : '',
                    Address: `${op.Account?.BillingStreet || ''} ${op.Account?.BillingCity || ''} ${op.Account?.BillingState || ''} ${op.Account?.BillingCountry || ''}`
                };
            });
        } else if (error) {
            console.error('Error fetching opportunities', error);
        }
    }

    // ---------------- TAB HANDLER ----------------
    handleTabChange(event) {
        this.selectedObject = event.target.value;
    }

    // ---------------- ROW ACTION HANDLER ----------------
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        if (actionName === 'edit') {
            this.modalRecord = row;
            this.modalObjectType = this.selectedObject;
            this.isModalOpen = true;
        }
    }

    // ---------------- MODAL HELPERS ----------------
    get isAccount() {
        return this.modalObjectType === 'Account';
    }
    get isLead() {
        return this.modalObjectType === 'Lead';
    }
    get isOpportunity() {
        return this.modalObjectType === 'Opportunity';
    }

    closeModal() {
        this.isModalOpen = false;
    }
}
