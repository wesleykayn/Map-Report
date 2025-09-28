import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import getAccounts from '@salesforce/apex/MapReportController.getAccounts';
import getLeads from '@salesforce/apex/MapReportController.getLeads';
import getOpportunities from '@salesforce/apex/MapReportController.getOpportunities';

export default class mapReport_component extends NavigationMixin(LightningElement) {
    selectedObject = 'Account';

    // ---------------- MODAL STATE ----------------
    @track mapMarkers = [];
    @track isModalOpen = false;
    @track modalObjectType;
    @track modalRecord = {}; // empty when creating new

    // store wired results so refreshApex can work
    wiredAccountResult;
    wiredLeadResult;
    wiredOpportunityResult;

    // store table data (also keep address fields used by map)
    @track accountData = [];
    @track leadData = [];
    @track opportunityData = [];

    // table columns (unchanged)
    @track accountColumns = [
        // { type: 'checkbox', fieldName: 'selected', label: '', initialWidth: 50 },
        {
            label: 'Account Name',
            fieldName: 'AccountUrl',
            type: 'url',
            typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' }
        },
        { label: 'Type', fieldName: 'Type', type: 'text' },
        { label: 'Account Record Type', fieldName: 'Record_Type_Name__c', type: 'text' },
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

    @track leadColumns = [
        // { type: 'checkbox', fieldName: 'selected', label: '', initialWidth: 50 },
        { label: 'Lead Name', fieldName: 'LeadUrl', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' } },
        { label: 'Company', fieldName: 'Company' },
        { label: 'Status', fieldName: 'Status' },
        { label: 'Record Type', fieldName: 'RecordTypeName', type: 'text' },
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

    @track opportunityColumns = [
        // { type: 'checkbox', fieldName: 'selected', label: '', initialWidth: 50 },
        { label: 'Opportunity Name', fieldName: 'OpportunityUrl', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' } },
        { label: 'Account Name', fieldName: 'AccountUrl', type: 'url', typeAttributes: { label: { fieldName: 'AccountName' }, target: '_blank' } },
        { label: 'Stage', fieldName: 'StageName' },
        { label: 'Amount', fieldName: 'Amount', type: 'currency' },
        { label: 'Record Type', fieldName: 'RecordTypeName', type: 'text' },
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

    // ------------- getters for modal types -------------
    get isAccount() {
        return this.modalObjectType === 'Account';
    }
    get isLead() {
        return this.modalObjectType === 'Lead';
    }
    get isOpportunity() {
        return this.modalObjectType === 'Opportunity';
    }

    // helper - whether markers array is ready (always true because updateMapMarkers ensures fallback)
    get hasMarkers() {
        return Array.isArray(this.mapMarkers) && this.mapMarkers.length > 0;
    }

    openModal(objectType, record = {}) {
        this.modalObjectType = objectType;
        this.modalRecord = record;
        this.isModalOpen = true;
    }

    closeModal(event) {
        const objectType = this.modalObjectType;
        this.isModalOpen = false;
        this.modalObjectType = null;
        this.modalRecord = {};

        if (objectType === 'Account') {
            refreshApex(this.wiredAccountResult).then(() => {
                this.updateMapMarkers();
            });
        } else if (objectType === 'Lead') {
            refreshApex(this.wiredLeadResult).then(() => {
                this.updateMapMarkers();
            });
        } else if (objectType === 'Opportunity') {
            refreshApex(this.wiredOpportunityResult).then(() => {
                this.updateMapMarkers();
            });
        }
    }
    //----MAP Centre----
    @track mapMarkers = [];
    mapCenter = {
        location: {
            Latitude: 23.5880,
            Longitude: 58.3829
        }
    };

    // ---------------- WIRE: ACCOUNTS ----------------
    @wire(getAccounts)
    wiredAccounts(result) {
        this.wiredAccountResult = result;
        const { data, error } = result;
        if (data) {
            // Map and KEEP raw billing fields so map logic can rely on them
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
                    Type: acc.Type,
                    Record_Type_Name__c: acc.Record_Type_Name__c,
                    Industry: acc.Industry,
                    AccountUrl: `/lightning/r/Account/${acc.Id}/view`,
                    OpportunityUrls: firstOpportunity ? firstOpportunity.url : null,
                    OpportunityNames: firstOpportunity ? firstOpportunity.name : '—',
                    // keep separate billing fields for the map
                    BillingStreet: acc.BillingStreet,
                    BillingCity: acc.BillingCity,
                    BillingState: acc.BillingState,
                    BillingCountry: acc.BillingCountry,
                    Address: `${acc.BillingStreet || ''} ${acc.BillingCity || ''} ${acc.BillingState || ''} ${acc.BillingCountry || ''}`.trim(),
                    OwnerName: acc.Owner ? acc.Owner.Name : ''
                };
            });
            if (this.selectedObject === 'Account') {
                this.updateMapMarkers();
            }
        } else if (error) {
            console.error('Error fetching accounts', error);
        }
    }

    // ---------------- WIRE: LEADS ----------------
    @wire(getLeads)
    wiredLeads(result) {
        this.wiredLeadResult = result;
        const { data, error } = result;
        if (data) {
            // Preserve individual address fields
            this.leadData = data.map(ld => {
                return {
                    Id: ld.Id,
                    Name: ld.Name,
                    Company: ld.Company,
                    Status: ld.Status,
                    RecordTypeName: ld.Record_Type_Name__c,
                    LeadUrl: `/lightning/r/Lead/${ld.Id}/view`,
                    OwnerName: ld.Owner ? ld.Owner.Name : '',
                    Street: ld.Street,
                    City: ld.City,
                    State: ld.State,
                    Country: ld.Country,
                    Address: `${ld.Street || ''} ${ld.City || ''} ${ld.State || ''} ${ld.Country || ''}`.trim()
                };
            });
            if (this.selectedObject === 'Lead') {
                this.updateMapMarkers();
            }
        } else if (error) {
            console.error('Error fetching leads', error);
        }
    }

    // ---------------- WIRE: OPPORTUNITIES ----------------
    @wire(getOpportunities)
    wiredOpportunities(result) {
        this.wiredOpportunityResult = result;
        const { data, error } = result;
        if (data) {
            // Keep account billing fields separately
            this.opportunityData = data.map(op => {
                const acct = op.Account || {};
                return {
                    Id: op.Id,
                    Name: op.Name,
                    StageName: op.StageName,
                    Amount: op.Amount,
                    RecordTypeName: op.Record_Type_Name__c,
                    OpportunityUrl: `/lightning/r/Opportunity/${op.Id}/view`,
                    AccountName: acct.Name || '',
                    AccountUrl: acct.Id ? `/lightning/r/Account/${acct.Id}/view` : '',
                    // preserve billing fields for the map
                    AccountBillingStreet: acct.BillingStreet,
                    AccountBillingCity: acct.BillingCity,
                    AccountBillingState: acct.BillingState,
                    AccountBillingCountry: acct.BillingCountry,
                    Address: `${acct.BillingStreet || ''} ${acct.BillingCity || ''} ${acct.BillingState || ''} ${acct.BillingCountry || ''}`.trim()
                };
            });
            if (this.selectedObject === 'Opportunity') {
                this.updateMapMarkers();
            }
        } else if (error) {
            console.error('Error fetching opportunities', error);
        }
    }

    // ---------------- MARKERS BUILD ----------------
    updateMapMarkers() {
        const markers = [];
        try {
            if (this.selectedObject === 'Account' && Array.isArray(this.accountData)) {
                this.accountData.forEach(acc => {
                    const city = acc.BillingCity;
                    const country = acc.BillingCountry;
                    if (city && country) {
                        markers.push({
                            location: {
                                Street: acc.BillingStreet || '',
                                City: city,
                                State: acc.BillingState || '',
                                Country: country
                            },
                            title: acc.Name || 'Account',
                            description: `Owner: ${acc.OwnerName || ''}`
                        });
                    }
                });
            } else if (this.selectedObject === 'Lead' && Array.isArray(this.leadData)) {
                this.leadData.forEach(ld => {
                    const city = ld.City;
                    const country = ld.Country;
                    if (city && country) {
                        markers.push({
                            location: {
                                Street: ld.Street || '',
                                City: city,
                                State: ld.State || '',
                                Country: country
                            },
                            title: ld.Name || 'Lead',
                            description: `Company: ${ld.Company || ''}`
                        });
                    }
                });
            } else if (this.selectedObject === 'Opportunity' && Array.isArray(this.opportunityData)) {
                this.opportunityData.forEach(op => {
                    const city = op.AccountBillingCity;
                    const country = op.AccountBillingCountry;
                    if (city && country) {
                        markers.push({
                            location: {
                                Street: op.AccountBillingStreet || '',
                                City: city,
                                State: op.AccountBillingState || '',
                                Country: country
                            },
                            title: op.Name || 'Opportunity',
                            description: `Account: ${op.AccountName || ''}`
                        });
                    }
                });
            }
        } catch (e) {
            console.error('Error building markers', e);
        }

        if (!Array.isArray(markers) || markers.length === 0) {
            this.mapMarkers = [{
                location: {
                    City: 'Muscat',
                    Country: 'Oman'
                },
                title: 'Muscat, Oman',
                description: 'Default location when no data is found'
            }];
        } else {
            this.mapMarkers = markers;
        }
    }

    // ---------------- TAB HANDLER ----------------
    handleTabChange(event) {
        this.selectedObject = event.target.value;
        this.updateMapMarkers();
    }

    // ---------------- ROW ACTION HANDLER ----------------
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        if (actionName === 'edit') {
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: row.Id,
                    objectApiName: this.selectedObject,
                    actionName: 'edit'
                }
            });

            const refreshTable = () => {
                if (this.selectedObject === 'Account') {
                    refreshApex(this.wiredAccountResult).then(() => {
                        this.updateMapMarkers();
                    });
                } else if (this.selectedObject === 'Lead') {
                    refreshApex(this.wiredLeadResult).then(() => {
                        this.updateMapMarkers();
                    });
                } else if (this.selectedObject === 'Opportunity') {
                    refreshApex(this.wiredOpportunityResult).then(() => {
                        this.updateMapMarkers();
                    });
                }
                window.removeEventListener('message', listener);
            };

            const listener = (event) => {
                if (event.data && event.data.type === 'closeQuickAction') {
                    refreshTable();
                }
            };
            window.addEventListener('message', listener);
        }
    }

    // ---------------- ROW SELECTION HANDLER ----------------
    handleRowSelection(event) {
        const selectedRows = event.detail.selectedRows;
        selectedRows.forEach(row => {
            if (this.selectedObject === 'Account') {
                console.log('This account is selected: ' + row.Name);
            } else if (this.selectedObject === 'Lead') {
                console.log('This lead is selected: ' + row.Name);
            } else if (this.selectedObject === 'Opportunity') {
                console.log('This opportunity is selected: ' + row.Name);
            }
        });
    }

    // ---------------- REFRESH HANDLER ----------------
    handleRefreshClick(event) {
        const objectType = event.currentTarget.dataset.object;
        if (objectType === 'Account') {
            refreshApex(this.wiredAccountResult).then(() => {
                this.updateMapMarkers();
            });
        } else if (objectType === 'Lead') {
            refreshApex(this.wiredLeadResult).then(() => {
                this.updateMapMarkers();
            });
        } else if (objectType === 'Opportunity') {
            refreshApex(this.wiredOpportunityResult).then(() => {
                this.updateMapMarkers();
            });
        }
    }

    // ---------------- NEW BUTTON HANDLER ----------------
    handleNewClick(event) {
        const objectType = event.currentTarget.dataset.object;
        this.openModal(objectType);
    }
}
