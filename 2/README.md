# The Node.js Master Class - Homework Assignment #2

This is the repo for the second assignment of The Node.js Master Class.

## API Documentation

This is the API documentation for a pizza-delivery company.

**Create User**
----
  Create a user.

* **URL:** /users

* **Method:** `POST`
  
*  **URL Params:** None

* **Data Params**

  **Required:** `email`, `firstName`, `lastName`, `password`, `streetAddress`

* **Sample Request:**
  ```json
  {
      "firstName": "Alex",
      "lastName": "Dale",
      "password": 123456,
      "streetAddress": "20, Ocean Ave. Florida",
      "email": "alex@o.com"
  }
  ```

* **Success Response:**

  * **Code:** 200 <br/>
    **Content:** `{ "Success": "User created successfully." }`
 
* **Error Response:**

  * **Code:** 400 Bad Request <br/>
    **Content:** `{ "Error": "Missing required fields." }`

  OR

  * **Code:** 400 Bad Request <br/>
    **Content:** `{ "Error" : "User already exists." }`

**Show User**
----
  Returns json data about a single user.

* **URL:** `/users?email=alex@o.com`

* **Method:** `GET`

*  **URL Params**

   **Required:** `email=[string]`

* **Data Params:** None

* **Success Response:**

  * **Code:** 200 <br/>
    **Content:**
    
    ```json
    {
        "firstName": "Alex",
        "lastName": "Dale",
        "streetAddress": "20, Ocean Ave. Florida",
        "email": "alex@o.com"
    }
    ```
 
* **Error Response:**

  * **Code:** 404 Not Found <br/>
    **Content:** `{ "Error" : "User does not exist." }`

  OR

  * **Code:** 400 Bad Request <br/>
    **Content:** `{ "Error" : "Missing required field." }`

**Update User**
----
  Updates user.

* **URL:** /users

* **Method:** `PUT`
  
*  **URL Params:** None

* **Data Params**

  **Required:** `email`

  **Optional:** `streetAddress`, `firstName`, `lastName`, `streetAddress`

  **Sample Request:** 
  ```json
  {
      "streetAddress": "20, Ocean Ave. Florida",
      "email": "alex@o.com"
  }
  ```

* **Success Response:**

  * **Code:** 200 <br/>
    **Content:** `{ "Success" : "User updated successfully." }`
 
* **Error Response:**

  * **Code:** 404 Not Found <br/>
    **Content:** `{ "Error" : "User does not exist" }`

  OR

  * **Code:** 400 Bad Request <br/>
    **Content:** `{ "Error" : "Missing required field." }`
  
  OR

  * **Code:** 400 Bad Request <br/>
    **Content:** `{ "Error" : "Missing fields to update." }`

**Delete User**
----
  Returns json data about a single user.

* **URL**

  /users/:id

* **Method:**

  `GET`
  
*  **URL Params**

   **Required:**
 
   `id=[integer]`

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ id : 12, name : "Michael Bloom" }`
 
* **Error Response:**

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{ error : "User doesn't exist" }`

  OR

  * **Code:** 401 UNAUTHORIZED <br />
    **Content:** `{ error : "You are unauthorized to make this request." }`

* **Sample Call:**

  ```javascript
    $.ajax({
      url: "/users/1",
      dataType: "json",
      type : "GET",
      success : function(r) {
        console.log(r);
      }
    });
  ```
