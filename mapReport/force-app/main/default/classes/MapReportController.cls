public with sharing class MapReportController {
    
    @AuraEnabled(cacheable=true)
    public static List<Account> getAccounts() {
        return [
            SELECT Id, Name, Industry, 
                   (SELECT Id, Name FROM Opportunities), 
                   BillingStreet, BillingCity, BillingState, BillingCountry, 
                   Owner.Name
            FROM Account
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Lead> getLeads() {
        return [
            SELECT Id, Name, Company, Status, Street, City, State, Country, Owner.Name
            FROM Lead
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Opportunity> getOpportunities() {
        return [
            SELECT Id, Name, StageName, Amount, Account.Name,
                   CloseDate, Account.BillingStreet, Account.BillingCity, Account.BillingState, Account.BillingCountry
            FROM Opportunity
        ];
    }
}
