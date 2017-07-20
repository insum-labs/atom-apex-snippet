#Apex Snippet Master Pack

* This snippet pack contains:
  * JavaScript snippets using Apex's API
  * Every single PL/SQL function from the [Apex API Reference](http://docs.oracle.com/database/apex-5.1/AEAPI/toc.htm)

##Install
Open Atom Package Manager, search for 'Apex Snippet Master Pack'  
_Alternatively_, open a console and type
`apm install apex-snippet-master-pack`


##Usage
_Note: File type must be set as either SQL or JavaScript for these snippets to apply._  

Activate this package in the menu at
>Packages > Apex Snippet Master Pack >

Or, right click in the file and select
>Packages > Apex Snippet Master Pack >

After making a selection, Atom will prompt the user to reload the window `(ctrl-shift-F5)` to apply the new snippet preferences.

> * comma before parameters
>   * lower-case procedure/function names with commas preceding parameters
>   * example:
>```
> apex_collection.update_member_attribute(
>   collection_name =>
> , seq =>
> , attr_number =>
> , attr_value =>
> );
> ```
>
> * comma after parameters
>    * lower-case procedure/function names with commas after parameters
>   * example:
>```
> apex_collection.update_member_attribute(
>   collection_name => ,
>   seq => ,
>   attr_number => ,
>   attr_value =>
> );
> ```
> * COMMA BEFORE parameters
>   * upper-case procedure/function names with commas preceding parameters
>   * example:
>```
> APEX_COLLECTION.UPDATE_MEMBER_ATTRIBUTE(
>   collection_name =>
> , seq =>
> , attr_number =>
> , attr_value =>
> );
> ```
>
> * COMMA AFTER PARAMETERS
>     * upper-case procedure/function names with commas after parameters
>   * example:
>```
> APEX_COLLECTION.UPDATE_MEMBER_ATTRIBUTE(
>   collection_name => ,
>   seq => ,
>   attr_number => ,
>   attr_value =>
> );
> ```
 ###Sponsor
 [Insum Solutions](http://insum.ca)

 ###Team
 Zach Wilcox   
 Ben Shumway
