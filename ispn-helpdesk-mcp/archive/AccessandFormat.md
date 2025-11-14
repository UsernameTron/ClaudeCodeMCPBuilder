
ISPN Helpdesk API Development Guide . Version 4.1.8

DISCLAIMER
This document is strictly private, confidential and personal to its recipients and should not be copied,
distributed or reproduced in whole or in part, nor passed to any third party without prior written consent.
API Overview
The ISPN Helpdesk API is an HTTP interface allowing the automated manipulation and retrieval of information stored in the ISPN Helpdesk databases. Through standard HTTP POST and GET methods, actions can be scripted to add or remove customers, alter services associated with customer entries, or make a number of other changes to achieve synchronization with billing systems or other outside databases.

When integrated with ISPN's vISP services, the API allows real time provisioning and management of working email, FTP, and other authenticated account types.
Access and Format
Access to the API is provided through an HTTPS secured CGI script on ISPN's Helpdesk TT server. Each client will be provided a unique access code which provides both authentication and authorization.

With each request to the API, a single command is processed. Multiple commands may be issued to enter a customer and associate services with that customer. The API requires a minimum of two arguments for each command. First, an authorization code must be provided. Second, a command must be declared. Additional information may be required in order to process each command. For example, the command to add a customer's account would require a unique customer ID (often a billing id) and would expect customer information such as name, telephone number, etc.

Example Request:
https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addcust&billid=999&fname=John&lname=Doe&hphone=1234567890&addr1=105%20Main%20St

Example Success Response:
1; OK; Customer 4256378 created

Note: HTTP POST and GET methods can be used interchangeably in the API. Note that standard URLENCODING is necessary when using HTTP GET to ensure data validity. You may provide variables in any order.

All ASCII values are acceptable as valid data input within HTTP urlencoded forms. However, certain data fields in the API may be more restrictive to comply with Internet standards or ISPN's internal data structure. The following table outlines these restrictions:

Data Field	Restriction
Telephone Numbers	Must be a string of 10 numeric digits.
Logins, Usernames, and Domains	Limited to 32 lowercase alphanumeric characters. Underscores, dashes, and periods are also allowed.

To comply with Internet standards, usernames and logins must contain at least 2 characters.
Passwords	Limited to 32 ASCII characters without spaces. Passwords are case sensitive. Other security based restrictions may apply (please check each API command).

For vISP mailboxes and authenticated accounts:
Password must be no less than 8 characters
Password cannot be the same or contain the username(or mailbox)
Password cannot be a dictionary word
All Other Fields	Limited to 32 ASCII characters.
Add Parent
command: { addparent }
Adds a parent entity, which resides above and can serve as common holder for multiple customer entities.
Attributes	Variable Name	Required	Recommended
Parent ID	parentid	•	
First Name	fname		•
Last Name	lname		•
Contact (email)	contact		•
Success:1; OK; Parent [unique HelpDesk ID] created
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addparent&parentid=999&fname=John&lname=Doe&contact=jdoe@domain.com
Add Customer
command: { addcust }
Adds a customer entity. Customer entities are the basis for which services and tickets can be associated.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billlid	•	
First Name	fname		•
Last Name	lname		•
Company/Business Name	cmpny		•
Home Telephone (10 digit)	hphone		•
Work Telephone (10 digit)	wphone		
Mobile Telephone (10 digit)	mphone		
Best Contact (10 digit)	fax		•
Address 1	addr1		•
Address 2	addr2		
City	cty		•
State	ste		•
Zip Code (5 digits)	zip		•
Login/Username (main)	login		
Password (DEPRECATED)	pass		
Security (CPNI) Password	sec		
Title	title		
Parent ID	parentid		
Success:1; OK; Customer [unique HelpDesk ID] created
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addcust&billid=999&fname=John&lname=Doe
Update Customer (billing info)
command: { updatecust }
Updates information for a given customer entity. Any fields provided will overwrite existing information. To empty a field, use the keyword 'NULL'.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
First Name	fname		
Last Name	lname		
Company/Business Name (10 digit)	cmpny		
Home Telephone (10 digit)	hphone		
Work Telephone (10 digit)	wphone		
Mobile Telephone (10 digit)	mphone		
Best Contact (10 digit)	fax		
Address 1	addr1		
Address 2	addr2		
City	cty		
State	ste		
Zip Code (6 digits)	zip		
Login (main)	login		
Password	pass		
Security Password	sec		
Title	title		
Success:1; OK; Customer Updated
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=updatecust&billid=999&fname=John&lname=Smith
Disable Customer
command: { discust }
Disables a customer entity and any associated services. Disabled customers should not expect to be able to authenticate, send/receive email, or access other services.
Supplying a '1' value to the Seasonal variable will place the account on seasonal disconnect. Supplying a '1' value to the Nonpay variable will inidicate the account was disabled for non-payment.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Seasonal Disconnect	seasonal		
Nonpay Flag	nonpay		
Success:1; OK; Account disabled
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=discust&billid=999
Enable Customer
command: { encust }
Enables a customer entity and any associated services.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Success:1; OK; Account enabled
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=encust&billid=999
Delete Customer
command: { delcust }
Deletes a customer entity and associated data and services.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Success:1; OK; Account removed; ISPN ID# [unique HelpDesk ID] removed
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=delcust&billid=999
Change Billing ID
command: { updateid }
Updates a customer's Internal Billing ID/Account Number.
Attributes	Variable Name	Required	Recommended
Current Billing ID	billid	•	
New Billing ID	newbill	•	
Success:1; OK; Customer Updated
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=updateid&billid=999&newbill=1000
Update Active Date
command: { updatedate }
Updates a customer's active date.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
New Active Service Date	activedate	•	
Success:1; OK; Customer Updated
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=updatedate&billid=999&activedate=2016-08-26 14:35:45
Add Customer Locations
command: { addlocation }
Adds a location specific entry for the customer ID
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Location ID	locationid	•	
Success:1; OK; Location ID added
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addlocaton&billid=999&locationid=123456
Add Service (plan)
command: { addsvc }
Associates a predefined service with a customer entity. ISPN should receive a master list of services and their descriptions from the client. If necessary, ISPN will supply a list of valid service IDs for use with this function if the client does not have their own.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Unique Service ID	sid	•	
Other (Auxiliary ID)	otherid		•
Service Type (I.e. INT vs CBL)	type		•
Associated Customer Number	custnumber		
Associated Account Number	acctnumber		
Associated Agreement Number	agmtnumber		
Service Address	address		•
City	city		•
State	state		•
Zip	zip		•
Associated Phone (10 digit)	phone		•
Success:1; OK; Service added
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addsvc&billid=999&sid=abc_dsl&otherid=3253480753
Delete Service (plan)
command: { delsvc }
Removes the association between a customer entity and a service.
Note: If an SID is supplied, only entries matching the supplied SID will be removed. If no SID is supplied, all entries associated with the customer will be removed.
Providing an agreement number value will restrict the command to the service entry associated with the agreement number.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Unique Service ID	sid	•	
Associated Agreement Number	agmtnumber		
Success:1; OK; Service deleted
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=delsvc&billid=999&sid=abc_dsl
Disable Service (plan)
command: { dissvc }
Marks a customer entity's service as disabled.
Providing an agreement number value will restrict the command to the service entry associated with the agreement number.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Unique Service ID	sid	•	
Associated Agreement Number	agmtnumber		
Success:1; OK; Service disabled
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=dissvc&billid=999&sid=abc_dsl
Enable Service (plan)
command: { ensvc }
Marks a customer entity's service as enabled.
Providing an agreement number value will restrict the command to the service entry associated with the agreement number.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Unique Service ID	sid	•	
Associated Agreement Number	agmtnumber		
Success:1; OK; Service enabled
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=ensvc&billid=999&sid=abc_dsl
Add Mailbox
command: { addmbox }
Creates a mailbox and associates it with a given customer entity.

To allow ISPN to auto-generate the password based on current password security requirements, set the 'nopass' value to 1. The password can be omitted from the command string. If 'nopass' variable is absent, the password field is required.

The primary variable will set the mailbox as primary in HelpDesk UI, thus giving the user in control additional authoritative functions and access to secondary mailbox authentication.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Mailbox (Fully Qualified)	mbox	•	
Password	pass		•
Auto-Generate Password (0 or 1)	nopass		
Primary Mailbox (0 or 1)	primary		
Success:1; OK; Mailbox Added
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addmbox&billid=999&mbox=john@abc.com&pass=abc123
Change Mailbox Password
command: { changempass }
Updates the password associated with a given mailbox. The new password will overwrite the existing password.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Mailbox (Fully Qualified)	mbox	•	
Password	pass	•	
Success:1; OK; Mailbox Password Changed
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addmbox&mbox=john@abc.com&pass=abc123
Disable Mailbox
command: { dismbox }
Disables a given mailbox. Disabled mailboxes retain messages, but should not expect to send or receive messages.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Mailbox (Fully Qualified)	mbox	•	
Success:1; OK; Mailbox Disabled
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=dismbox&mbox=john@abc.com
Enable Mailbox
command: { enmbox }
Enables a given mailbox.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Mailbox (Fully Qualified)	mbox	•	
Success:1; OK; Mailbox Enabled
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=enmbox&mbox=john@abc.com
Delete Mailbox
command: { delmbox }
Deletes a mailbox and its contents.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Mailbox (Fully Qualified)	mbox	•	
Success:1; OK; Mailbox Deleted
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=delmbox&mbox=john@abc.com
Attach Mailbox
command: { attachmbox }
Associates a mailbox and its contents with a different customer entry.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Mailbox (Fully Qualified)	mbox	•	
Primary (a value of 1 will flag	primary		
Success:1; OK; Mailbox Attached
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=attachmbox&mbox=john@abc.com&billid=999
Update Mailbox Quota
command: { mboxquota }
Change the mailbox quota.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Mailbox (Fully Qualified)	mbox	•	
Quota (Bytes)	quota	•	
Success:1; OK; Quota Updated
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=mboxquota&mbox=john@abc.com"a=1024000000
Add Alias
command: { addalias }
Creates a email alias and associates it with a given customer entity.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Alias	als	•	
Destinaton Address	dest	•	
Expiration	exp		
Success:1; OK; Alias Added
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addalias&billid=999&alias=john@abc.com&dest=abc123&expiration=
Delete Alias
command: { delalias }
Deletes a alias.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Alias	als	•	
Success:1; OK; Alias deleted
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=delalias&billid=999&alias=john@abc.com
Add Auth Account
command: { addauth }
Adds an auth account entry, associating it with a given customer entity. Authenticated accounts typically tie to RADIUS to provide authentication, authorization, and accounting to network services such as PPP/PPPoE/PPPoA.
This command should be used for authoritative sources provisioned outside of HelpDesk.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Authenticated User	usr	•	
Authenticated Password	pass	•	
Authenticated Service Type	svc		
Success:1; OK; Auth info added
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addauth&billid=999&usr=john@abc.com&pass=abc123&svc=abc_dial
Update Auth Account
command: { updateauth }
Updates the password or service type for a given auth account.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Authenticated User	usr	•	
Authenticated Password	pass		•
Authenticated Service Type	svc		
Success:1; OK; Authentication information updated
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=updateauth&usr=john@abc.com&pass=abc123
Delete Auth Account
command: { delauth }
Removes an auth account from a customer entry.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Authenticated User	usr	•	
Success:1; OK; Authentication information updated
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=delauth&usr=john@abc.com
Disable Auth Account
command: { disauth }
Disables auth account attached to the customer entry.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Authenticated User	usr	•	
Success:1: OK; Auth account disabled
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=disauth&usr=john@abc.com
Enable Auth Account
command: { enauth }
Enables auth account attached to the customer entry.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Authenticated User	usr	•	
Success:1: OK; Auth account enabled
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=enauth&usr=john@abc.com
Add CPE Information
command: { addcpe }
Associates CPE information with a given customer entity. Multiple CPE devices can be associated with a customer as long as each entry has a unique IP address.

This command should be used for authoritative sources provisioned outside of HelpDesk.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Circuit ID	circuit		
IP Address	ip	•	
Netmask	nm		
Gateway	gw		
MAC	mac		
Wireless Key	key		
CPE Type or Description	type		
Miscellaneous information	misc		
Auxiliary Field 1	aux1		
Auxiliary Field 2	aux2		
Auxiliary Field 3	aux3		
Success:1; OK; CPE info added
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addcpe&billid=999&ip=1.2.3.4
Delete CPE Information
command: { delcpe }
Removes CPE information associated with a given customer entity.
Note: If an IP address is supplied, only entries matching the supplied IP will be removed. If no IP address is supplied, all entries associated with the customer will be removed.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
IP Address	ip	•	
Success:1; OK; CPE info removed
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=delcpe&billid=999&ip=1.2.3.4
Add CPE Information (*)
command: { addequip }
This command is similar to Add CPE Information, but uses a more tailored database structure to store any and all CPE information, that may or may not be specifically tied to an IP address. Upon success, the API will return the internal equipment ID to track the entry.

If the agreement number provided matches an agreement number tied to a service plan, this equipment entry will be tied to the service plan as well.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Attribute	attribute	•	
Value	value	•	
Comments	comments		•
Account Number	acctnumber		•
Customer Number	custnumber		•
Agreement Number	agmtnumber		•
Success:1; OK; CPE Attribute added; ID 123
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addequip&billid=999&attribute=Calix&value=804 Mesh&comments=basement modem
Delete CPE Information (*)
command: { delequip }
Delete CPE entries based on unique CPE IDs. CPE internal IDs can be obtained by executing a 'list' command for the specific customer Billing Id.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Internal Equipment ID	equipid	•	
Success:1; OK; CPE Attribute deleted
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=delequip&billid=999&equipid=123
Modify CPE Information (*)
command: { modequip }
Modify CPE entries based on unique CPE IDs. CPE internal IDs can be obtained by executing a 'list' command for the specific customer Billing Id.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Internal Equipment ID	equipid	•	
Attribute	attribute	•	
Value	value	•	
Comments	comments		•
Account Number	acctnumber		•
Customer Number	custnumber		•
Agreement Number	agmtnumber		•
Success:1; OK; CPE Attribute modified
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=modequip&billid=999&equipid=123&&attribute=Calix&value=804 Mesh&comments=basement modem
Add Radius Auth
command: { addrad }
Adds an entry into RADIUS, associating it with a given customer entity. RADIUS provides authentication, authorization, and accounting to network services such as PPP.
If the groupname provided matches an existing service type definition, a service entry will be created and associated with the radius auth entry. The additional fields (type,auxiliary account numbers, service address info) are included for this reason.

To allow ISPN to auto-generate the password based on current password security requirements, set the 'nopass' value to 1. The password can be omitted from the command string. If 'nopass' variable is absent, the password field is required.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Radius User	usr	•	
Radius Password	pass	•	
Radius User Group	grp	•	
Service Type (I.e. INT vs CBL)	type		•
Associated Customer Number	custnumber		
Associated Account Number	acctnumber		
Associated Agreement Number	agmtnumber		
Service Address	address		•
City	city		•
State	state		•
Zip	zip		•
Associated Phone (10 digit)	phone		•
Auto-Generate Password (0 or 1)	nopass		
Success:1; OK; Radius info added
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addrad&billid=999&usr=john@abc.com&pass=abc123&grp=abc_dial
Change Radius Password
command: { changerpass }
Updates the password for in RADIUS for a given account. The new password overwrites the existing password.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Radius User	usr	•	
Radius Pass	pass	•	
Success:1; OK; Radius password changed
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=changerpass&usr=john@abc.com&pass=abc123
Disable Radius Auth
command: { disrad }
Disables an account in RADIUS. Disabled accounts can no longer authenticate, but remain in the database.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Radius User	usr	•	
Success:1; OK; Radius entry disabled
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=disrad&billid=999&usr=john@abc.com
Delete Radius Auth
command: { delrad }
Removes an account from RADIUS. Accounts removed from RADIUS can no longer authenticate.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Radius User	usr	•	
Success:1; OK; Radius entry deleted
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=delrad&billid=999&usr=john@abc.com
Enable Radius Auth
command: { enrad }
Enables an account in RADIUS.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Radius User	usr	•	
Success:1; OK; Radius entry enabled
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=enrad&billid=999&usr=john@abc.com
Check Radius profile status
command: { checkrad }
Success:
Failure:0; Error output will vary

Example:
Add FTP Account
command: { addftp }
Creates an FTP account and associates it with a given customer entity. FTP accounts are used for personal webspace.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
FTP User	usr	•	
FTP Password	pass	•	
Success:1; OK; FTP info added
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addftp&billid=999&usr=john@abc.com&pass=abc123
Change FTP Password
command: { changeftppass }
Updates an FTP password. The new password overwrites the existing one.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
FTP User	usr	•	
FTP Password	pass	•	
Success:1; OK; FTP password changed
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=changeftppass&billid=999&usr=john@abc.com&pass=abc123
Disable FTP Account
command: { disftp }
Disables FTP account. User is not able to authenticate and access the file storage of the disabled FTP account.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
FTP User	usr	•	
Success:1; OK; FTP entry disabled
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=disftp&billid=999&usr=john@abc.com
Delete FTP Account
command: { delftp }
Deletes an FTP account. All files in the customer's personal web space are removed.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
FTP User	usr	•	
Success:1; OK; FTP entry deleted
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=delftp&billid=999&usr=john@abc.com
Enable FTP Account
command: { enftp }
Enables an FTP account.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
FTP User	usr	•	
Success:1; OK; FTP entry enabled
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=enftp&billid=999&usr=john@abc.com
Add DHCP
command: { adddhcp }
Creates a DHCP reservation for a subscriber. DHCP reservations authorize a subscriber device, authenticated by MAC, to access the network.

If an IP address is specified, the subscriber's reservation will bind to it. Each IP binding must be unique and valid to prevent IP conflicts.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
MAC Address	mac	•	
IP Address	ip		
Reservation Type (valid options are CPE or Modem)	type		
Firmware Filename (used for cable modem configuration)	file		
Equipment Note	note		
Auxiliary Field 1	aux1		
Auxiliary Field 2	aux2		
Auxiliary Field 3	aux3		
Success:1; OK; DHCP Entry [unique HelpDesk ID] Added
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=adddhcp&billid=999&mac=01%3A02%3A03%3A04%3A05%3A06&ip=1.2.3.4
Update DHCP
command: { updatedhcp }
Update existing DHCP reservation
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
MAC Address	mac	•	
IP Address	ip	•	
New MAC Address	newmac	•	
New IP Address	newip	•	
Reservation Type (valid options are CPE or Modem)	type		
Firmware Filename (used for cable modem configuration)	file		
Equipment Note	note		
Auxiliary Field 1	aux1		
Auxiliary Field 2	aux2		
Auxiliary Field 3	aux3		
Success:1; OK; DHCP Entry [unique HelpDesk ID] Updated
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=updatedhcp&billid=999&mac=01%3A02%3A03%3A04%3A05%3A06&ip=1.2.3.4&newmac=01%3A02%3A03%3A04%3A05%3A06&newip=1.2.3.5
Disable DHCP
command: { disdhcp }
Disables a DHCP reservation associated with a given customer entity.

Note: If a MAC or IP address is supplied, only entries matching the supplied address will be disabled. If no address is supplied, all entries associated with the customer will be disabled.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
MAC Address	mac		
IP Address	ip		
Success:1; OK; [number of entries] DHCP entries disabled
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=disdhcp&billid=999&mac= 01%3A02%3A03%3A04%3A05%3A06
Enable DHCP
command: { endhcp }
Enables a DHCP reservation associated with a given customer entity.

Note: If a MAC or IP address is supplied, only entries matching the supplied address will be enabled. If no address is supplied, all entries associated with the customer will be enabled.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
MAC Address	mac		
IP Address	ip		
Success:1; OK; [number of entries] DHCP entries enabled
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=endhcp&billid=999&mac= 01%3A02%3A03%3A04%3A05%3A06
Delete DHCP
command: { deldhcp }
Removes a DHCP reservation associated with a given customer entity.

Note: If a MAC or IP address is supplied, only entries matching the supplied address will be removed. If no address is supplied, all entries associated with the customer will be removed.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
MAC Address	mac	•	
IP Address	ip		
Success:1; OK; [number of entries] DHCP entries removed
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=deldhcp&billid=999&mac= 01%3A02%3A03%3A04%3A05%3A06
List DHCP
command: { listdhcp }
Outputs a list of used/free DHCP reservations.
Can be used to find the next free IP address when provisioning a DHCP entry or for auditing entire IP usage.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid		
DHCP Pool	pool		
DHCP Pool Status	poolstatus		
Query Limit	limit		
IP Address	ip		
Success:
Failure:0; Error output will vary
Sample XML Structure:
<dhcplist>
	<dhcp>
		<billid></billid>			
		<type></type>
		<filename></filename>
		<mac></mac>
		<ip></ip>
		<equipment></equipment>
		<reservation_status></reservation_status>
		<pool></pool>
		<pool_status></pool_status>
		<aux_01></aux_01>
		<aux_02></aux_02>
		<aux_03></aux_03>
	</dhcp>
</dhcplist>

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=listdhcp
Add Note
command: { addnote }
Adds a customer note to ISPN's Trouble Ticket database, associated with the given customer entry.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Note Description	desc	•	
Success:1; OK; Note added
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addnote&billid=999&desc=customer%20notes
Delete Notes
command: { delnotes }
Deletes all notes associated with the given customer entry.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Success:1; OK; Notes deleted
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=delnotes&billid=999
Add CPNI Information
command: { addcpniq }
Add CPNI information, in the form of question/answer pair, associated with the given customer entry.
Note: CPNI q/a pairs with question matching existing data will be updated with new answers.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Question	question	•	
Answer	answer	•	
Success:1; OK; CPNI Question added
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addcpniq&billid=999&question=question&answer=answer
View CPNI Information
command: { viewcpniq }
View CPNI question/answer pairs, based on the question.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Question	question	•	
Success:
Failure:0; Error output will vary
Sample XML Structure:
<customer>
	<billid></billid>
	<CPNI>
		<ID></ID>				
		<question></question>
		<answer></answer>
	</CPNI>
</customer>

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=viewcpniq&billid=999&question=question
Delete CPNI Information
command: { delcpniq }
Will delete CPNI information based on the internal question ID (which is retrieved using the 'viewcpniq' command).
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Question ID	qid	•	
Success:1; OK; CPNI Question deleted
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=delcpniq&billid=999&qid=123
Add Alternate Email
command: { addaltemail }
Add alternate email address (hosted elsewhere, i.e. gmail.com), associated with the given customer entry.
Attributes	Variable Name	Required	Recommended
Internal Billig ID	billid	•	
Alternate Email Address	altemail	•	
Success:1; OK; Alternate Email added
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addaltemail&billid=999&altemail=user%40domain
Add Auxiliary Data
command: { addauxdata }
Add auxiliary customer data, associated with the given customer entry.
Note: existing auxiliary data will be overwritten on subsequent command calls.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Auxiliary Data	auxdata	•	
Success:1; OK; Auxiliary Data added
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addauxdata&billid=999&auxdata=data
Add/Set Account Priority
command: { addpriority }
Update or modify customer priority status.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Priority Status Flag (0 or 1)	priority	•	
Success:1; OK; Priority Flag added
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addpriority&billid=999&priority=1
Add Customer Phone
command: { addphone }
Adds an associated customer telephone number. There is no limit on how many numbers can be associated with a customer entry. Associated network ids, types, and other auxiliary ids can be paired with the phone number as well.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Phone (10 digit)	phone	•	
Associated Network ID	netid		•
Other ID	otherid		
Associated Network Type	nettype		•
Success:1; OK; Phone number added
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addphone&billid=999&phone=1234567890&netid=444&nettype=CBL
Add Authorized Contact
command: { addcontact }
Add an authorized account contact, a designated user with specific account access rights.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Contact Name	name	•	
Phone	phone		•
Title	title		•
Email	email		•
Access Level	access		•
Success:1; OK; Customer contact added
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addcontact&billid=999&name=John&20Smith&phone=1234567890&email=jsmith@domain.com
Add Parent ID
command: { addparentid }
Add a parent ID to a customer entity to associate with an existing parent entity.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Parent ID	parentid	•	
Success:1; OK; Parent ID added
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addparentid&billid=999&parentid=1234
Set Business Status
command: { setbus }
Mark a customer entity as a business.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Success:1; OK; Business status updated
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=setbus&billid=999
List Customer Phones
command: { listphone }
List all customer phones associated with the account identified by the Internal Billing ID. If the phone number value is provided in the query, the API will return a singular result as the means of verification, otherwise all listed phone numbers that are associated with the Billing ID will be returned.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Phone Number	phone		
Success:
Failure:0; Error output will vary
Sample XML Structure:
<phonelist>
  <phone>
    <phoneid>1</phoneid>
    <number>1234567890</number>
    <networkid>1111</networkid>
    <otherid>2222</otherid>
    <phonetype>mobile</phonetype>
    <networktype>Internet</networktype>
  </phone>
</phonelist>

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=listphone&billid=999&phone=1234567890
Delete Customer Phone
command: { delphone }
Delete a phone number entry associated with the Billing ID in HelpDesk.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Phone Number	phone	•	
Success:1; OK; Phone number deleted
Failure:0; Error output will vary

Example:
List Notes
command: { listnotes }
List all active notes on a customer record.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Success:
Failure:0; Error output will vary
Sample XML Structure:
<notelist>
	<note>
		<noteid></noteid>
		<enteredby></enteredby>
		<notetime></notetime>
		<description></description>
	</note>
</notelist>

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=listnotes&billid=999
Delete Customer Note
command: { delnote }
Delete a specific customer note identified by the note ID.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Note ID	noteid	•	
Success:1; OK; Note [note id] deleted
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=delnote&billid=999¬eid=4567
List Customer Contacts
command: { listcontacts }
List customer authorized contact information and associated details.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Success:
Failure:0; Error output will vary
Sample XML Structure:
<contacts>
	<contact>
		<contactid></contactid>
		<name></name>
		<phone></phone>
		<title></title>
		<email></email>
		<accesss></accesss>
	</contact>
</contacts>

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=listcontacts&billid=999
Delete Customer Contact
command: { delcontact }
Delete a specific customer contact identified by the contact ID.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Contact ID	contactid		
Success:1; OK; Customer Contact [contact ID] deleted
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=delcontact&billid=999&contactid=4567
User Check
command: { usercheck }
This function allows an outside system to determine if a username is already in use. This can be helpful in provisioning unique user accounts.
Attributes	Variable Name	Required	Recommended
Username	user	•	
Success:1; User Exists; PRIMARY LOGIN
1; User Exists; EMAIL
1; User Exists; ALIAS
1; User Exists; RADIUS
1; User Exists; FTP
Failure:0; User Not Found

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=usercheck&user=jdoe
Mailbox Check
command: { mboxcheck }
This function allows an outside system to determine if an email address is already in use. This can be helpful in provisioning unique user accounts.
Attributes	Variable Name	Required	Recommended
Email	email	•	
Success:1; User Exists; EMAIL (Qualified); Bill ID [Internal Billing ID]; Status [mailbox status]
Failure:0; Email Not Found

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=mboxcheck&email=jdoe@domain.com
Add Ticket
command: { addtix }
Adds a ticket to ISPN's Trouble Ticket database, associated with the given customer entry. Supported category IDs may be provided - they are retrievable via the listsupportcat API command. Multiple category IDs should be entered as a single string separated by a dash (-)

If callback flag is set, the ticket will be flagged for callback in ISPN HelpDesk.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Ticket Description	desc	•	
Parent Ticket ID (if issuing an update)	parent		
Callback Flag	callback		
Callback Contact	contact		
Category ID (see 'listsupportcat')	catid		
External Account Number	acctno		
Service Address	svcaddr		
Success:1; OK; Ticket added; [internal HelpDesk ID]
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addtix&billid=999&desc=ticket%20notes
Reassign Escalation
command: { escreassign }
Reassign an escalation back to ISPN, associated with the given customer entry and ticket/escalation.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billlid	•	
Escalation ID	escalid	•	
Reassignment Note	desc	•	
Success:1; OK; Escalation Reassigned
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=escreassign&billid=999&escalid=333&desc=escalation%20notes
Close Escalation
command: { escclose }
Close an active escalation, associated with the given customer entry and ticket/escalation.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Escalation ID	escalid	•	
Closing Note	desc	•	
Success:1; OK; Escalation Closed
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=escclose&billid=999&escalid=333&desc=escalation%20notes
Update Escalation
command: { escupdate }
Updates an existing open escalation.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Escalation ID	escalid	•	
Update Description	desc	•	
Success:1: OK; Escalation Updated
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=escupdate&billid=999&escalid=333&desc=escalation%20notes
List Support Service Entries
command: { listsupportsvc }
Returns a list of supported services (suitable for ticket entry) and their related numerical service IDs.
Success:
Failure:0; Error output will vary
Sample XML Structure:
<servicelist>
	<service>
		<serviceid>17</serviceid>
		<servicename>DSL</servicename>
	</service>
	<service>
		<serviceid>18</serviceid>
		<servicename>Cable</servicename>
	</service>
	<service>
		<serviceid>20</serviceid>
		<servicename>Fiber</servicename>
	</service>
</servicelist>

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=listsupportsvc
List Support Category Entries
command: { listsupportcat }
Returns a list of supported categories (suitable for ticket entry) and their related numerical category IDs.
Success:
Failure:0; Error output will vary
Sample XML Structure:
<categorylist>
	<category>
		<serviceid>17</serviceid>
		<servicename>DSL</servicename>
		<categoryid>12345</categoryid>
		<categoryname>Speed Issues</categoryname>
	</category>
</categorylist>

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=listsupportcat
Add Provider Alert
command: { addalert }
Mirrors "Add Alert" functionality of the HelpDesk web interface.
Alerts provide information the HelpDesk will relay to callers in the event of an outage or other widespread issue currently affecting large groups of subscribers.

Severity Levels:
2 - Service affecting (All Technicians)
1 - Informational (All Technicians)
0 - Investigating (Supervisor Only)

Start and stop times are optional. Alerts will only be visible between the specified start and stop times. If the stop time is omitted, the alert will auto-close in one day.
Attributes	Variable Name	Required	Recommended
Begin Date (YYYY-MM-DD)	fromdate		•
End Date (YYYY-MM-DD)	todate		•
Begin Time (HH:MM:SS)	fromtime		•
End Time (HH:MM:SS)	totime		•
Severity Level (2,1,0)	severity	•	
Alert Content	alerttext	•	
Telco/Provider Tracking ID (numeric only)	telcoid		•
Voice Prompt (1,0)	prompt		
Estimated Time of Repair Date (YYYY-MM-DD)	etrdate		
Estimated Time of Repair Time (HH:MM:SS)	etrtime		
Authorized by Name	authname	•	
Authorized by Phone	authphone	•	
Authorized by Email	authemail		•
Success:1; OK; Alert added;
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addalert&severity=2&prompt=1&telcoid=987654&alerttext=test&authname=Test&authphone=123456789&fromdate=2020-03-01&todate=2020-03-10
List Users
command: { list }
Returns a list of customer entities in XML format. When a billing ID is provided, this function serves to confirm the existence of a customer entity and the information associated with it.

If no billing ID is provided, then a list of all customer entities will be returned.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid		
Success:
Failure:0; Nothing Found
Sample XML Structure:
Partial XML output:

<customer>
	<billid>999</billid>
	<fname>John</fname>
	<lname>Doe</lname>
</customer>

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=list&billid=999
List Tickets by Subscriber
command: { listtix }
Returns a list of ticket entries associated with a customer in XML format. If no limit is provided, then a list of all tickets for the given customer will be returned. A valid ticket id may also be provided to further filter XML output.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Ticket ID	ticketid		
Maximum number of tickets to return	limit		
Success:
Failure:0; Nothing Found
Sample XML Structure:
<ticketlist>
  <ticket>
    <parentid>0</parentid>
    <ticketid>123456</ticketid>
    <entrytime>2009-05-08 16:26:29</entrytime>
    <categories>
       <service>Email</service>
       <category>Connectivity</category>
    </categories>
    <description>Customer is having problems accessing email...</description>
  </ticket>
</ticketlist>

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=listtix&billid=999&top=1
List Tickets for All Users
command: { listtixall }
Returns a list of ticket entries for all customers between two dates in XML format.
If the hour variable is specified (1), the end date can be omitted and the command will return tickets at one hour increments from the {begin} date/time specified. Including time at that point is recommended.
Attributes	Variable Name	Required	Recommended
Begin Date (inclusive)	begin	•	
End Date (inclusive)	end	•	
Hourly Segment	hour		
Success:
Failure:0; Nothing Found
Sample XML Structure:
<ticketlist>
  <ticket>
    <billid>999</billid>
    <parentid>0</parentid>
    <ticketid>123456</ticketid>
    <entrytime>2009-05-08 16:26:29</entrytime>
    <categories>
       <service>Email</service>
       <category>Connectivity</category>
    </categories>
    <description>Customer is having problems accessing email...</description>
  </ticket>
</ticketlist>

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=listtixall&begin=2009-01-01&end=2009-12-31
List Escalations for All Users
command: { listescalall }
Returns a list of escalation entries for all customers between two dates in XML format. Optionally, a status field may be provided to show only escalations that are open (1) or closed (0).
If the hour variable is specified (1), the end date can be omitted and the command will return tickets at one hour increments from the {begin} date/time specified. Including time at that point is recommended.
Attributes	Variable Name	Required	Recommended
Begin Date (inclusive)	begin	•	
End Date (inclusive)	end	•	
Escalation Status	status	•	
Hourly Segment	hour		
Success:
Failure:0; Nothing Found
Sample XML Structure:
<escalationlist>
  <escalation>
    <escalid>1234</escalid>
    <ticketid>4567</ticketid>
    <status>open</status>
    <billid>999</billid>
    <entrytime>2010-10-29 13:52:42</entrytime>
    <summary>summary of escalation</summary>
    <detail>CUSTOMER INFORMATION
        Name:  John Doe
        eMail: john@abc.com
        Home phone Number: 1234567890
        Ticket ID: 123456
        Initial approval by: (No Approval Required)
    </detail>
    <closetime>0000-00-00 00:00:00</closetime>
    <closenotes></closenotes>
  </escalation>
</escalationlist>

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=listescalall&begin=2009-01-01&end=2009-12-31&status=1
List Escalation by Escalation ID
command: { listescal }
Returns a specific escalation entry in XML format.
Attributes	Variable Name	Required	Recommended
Escalation ID	escid	•	
Success:
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=listescal&escid=12345
Create a sales campaign
command: { addcampaign }
Create a sales(upsell/marketing) campaign in HelpDesk. If the start date value is ommitted, the campaign will be marked active on the day it is created.
Attributes	Variable Name	Required	Recommended
Campaign Description	desc	•	
Campaign Script	script	•	
Campaign Contact (email)	contact	•	
Start Date	startdate		•
Stop Date	stopdate		•
External Campaign ID	externalid		
Success:1; OK; Campaign added;
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=addcampaign&desc=Test Sales Campaign&script=Read me please&contact=email@domain.com
Flag customer for sales campaign
command: { cmpflag }
Flag a customer record for a marketing campaign.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Sales/Marketing Campaign ID	campid	•	
Success:1; OK; Customer Flagged for campaign
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=cmpflag&billid=999&campid=1
List existing sales campaigns
command: { listcampaign }
Query and list data for existing marketing campaigns. The results are returned in XML format. If campaign ID is specified, the results wil lbe limited to a single campaign details.
Attributes	Variable Name	Required	Recommended
Sales/Marketing Campaign ID	campid		•
List flagged users	listusers		
Success:
Failure:0; Error output will vary
Sample XML Structure:
<campaigns>
  <campaign>
	<camp_id>7</camp_id>
	<enteredon>2022-01-18 13:10:19</enteredon>
	<description>This is a marketing campaign for DSL users with 50Mb downstream or less.</description>
	<script>I noticed that your connection is slow, would you be interested in having our marketing team reach out to you to discuss bandwidth upgrades?</script>
	<email>email@domain.com</email>
	<status>1</status>
	<startdate>2022-01-30</startdate>
	<stopdate>0000-00-00</stopdate>
  </campaign>
</campaigns>

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=listcampaign&campid=7
Unflag customer from sale campaign
command: { cmpunflag }
Unflag a customer record from a marketing campaign.
Attributes	Variable Name	Required	Recommended
Internal Billing ID	billid	•	
Sales/Marketing Campaign ID	campid	•	
Success:1; OK; Customer Unflagged for campaign
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=cmpunflag&billid=999&campid=1
Delete a sales campaign
command: { delcampaign }
Remove a sales(upsell/marketing) campaign from HelpDesk.
Attributes	Variable Name	Required	Recommended
Sales/Marketing Campaign ID	campid	•	
Success:1; OK; Campaign deleted
Failure:0; Error output will vary

Example: https://api.helpdesk.ispn.net/exec.pl?auth=abcXYZ&cmd=delcampaign&campid=7
EXAMPLES
ISPN's Helpdesk Trouble Ticket API may be accessed via any method that implements HTTPS POST or GET methods. This includes, but is not limited to, PHP, Perl, Ruby, shell scripts, or even a standard web browser. This flexibility allows the API to be accessed and integrated within existing order entry systems in real time or to be scripted based on data from reports, transaction logs, or other sources.

Following are a few example implementations:

	<?php
	// set common vars
	 = 'https://api.helpdesk.ispn.net/exec.pl';
	 = 'abcXYZ';
	
	//Create User John Doe
	 = sendCommand(, , "addcust", array(
			"billid" => 999, 
			"fname" => "John", 
			"lname" => "Doe")) 
	  or die("Error: Could not connect to API
");
	
	//If successful, add DSL and email account
	if( == 1) {
	        sendCommand(, , "addsvc", array(
	        		"billid" => 999, 
	        		"sid" => "abc_dsl")) 
	          or die("Error: Could not connect to API
");
	        sendCommand(, , "addmbox", array(
	        		"billid" => 999, 
	        		"mbox" => "john.com", 
	       		"pass" => "abc123")) 
	          or die("Error: Could not connect to API
");
	} else {
	        die("There was a problem processing your request - The user could not be added.
 Error code: 
");
	}
	
	// Function sendCommand
	// Takes the API URL, Auth Code, Command to issue, and an array including the variables to pass and their values.
	// Returns FALSE if the request fails, otherwise returns the response from the upstream API
	function sendCommand (, , , )
	{
	         = "?auth=&cmd=";
	
	        foreach ( as  => )
	        {
	                .="&=".urlencode();
	        }
	
	        // create a new cURL resource
	         = curl_init();
	        // set URL and other appropriate options
	        curl_setopt(, CURLOPT_URL, );            // set address
	        curl_setopt(, CURLOPT_HEADER,0);                 // don't return headers
	        curl_setopt(, CURLOPT_RETURNTRANSFER, 1);        // return web page
	        curl_setopt(, CURLOPT_SSL_VERIFYHOST, 0);        // don't verify cert
	        curl_setopt(, CURLOPT_SSL_VERIFYPEER, 0);        // don't verify cert
	        // grab URL and pass it to the browser
	         = curl_exec();
	        // close cURL resource, and free up system resources
	        curl_close();
	
	        if( == FALSE) {
	                return FALSE;
	        } else {
	                return ;
	        }
	}
	
	?>
	
	
	#!/bin/bash
	
	cat /var/log/transaction.log | grep add | 
	awk '{print "wget https://api.helpdesk.ispn.net/exec.pl?authcode=abcXYZ&cmd=adduser&billid=&fname=&lname="}'
	cat /var/log/transaction.log | grep add | 
	awk '{print "wget https://api.helpdesk.ispn.net/exec.pl?authcode=abcXYZ&cmd=addmbox&billid=&mbox=&pass="}'
					
