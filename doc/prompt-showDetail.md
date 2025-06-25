in the database, each performer will have a songlist. 
the fields in the songlist will be:
- songname
- artist
- year
- tags :this is an array of strings, for genre, mood, etc.
- key
- notes

on the home.jsx page, when the user clicks the show title, 
go to a show detail page. 

on the show detail page, the user can see the show title in the page title. 
the performer's names will appear below the show title. 
next line, "request 3 upbeat, well known songs"
then there will be a form (see task.jsx) 
with 3 select-autocomplete fields (see -input.jsx)
these fields will be freesolo, so that intellisense will work for the songlist, but the user can type their own songname. 
   the autocomplete will see song, artist, and tags. 
   when a dropdown value is selected, the songname will be filled in, with the artist's initials. 

below these fields have an input field for comments/dedication. 
below that comments/dedication, there will be a numeric input field for tip amount, with a default value of 5. it cannot be less that 1 or more than 100.

then a request "button", is actually a dynamic hyperlink that will send the info to venmo.

as the user enters data, the link will be formatted as follows:

https://venmo.com/GoEvenSteven?txn=pay&amount=${tipamount}&note=7169:confirm%E2%80%A6$${songs},%20DEDICATION-${dedication}

onClick, the requestbutton will also save the song _id to the database with the show _id,  










