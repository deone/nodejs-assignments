# The Node.js Master Class - Homework Assignment #2

This is the repo for the second assignment of The Node.js Master Class.

## API Documentation

This is the API documentation for a pizza-delivery company.

**Create User**
----
  Create a user.

* **URL:** `/users`

* **Method:** `POST`
  
*  **URL Params:** None

* **Data Params**

  **Required:** `email`, `firstName`, `lastName`, `password`, `streetAddress`.

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
    **Content:**
    
    ```json
    {
        "Success": "User created successfully."
    }
    ```
 
* **Error Response:**

  * **Code:** 400 Bad Request <br/>
    **Content:**
    
    ```json
    {
        "Error": "Missing required fields."
    }
    ```

  OR

  * **Code:** 400 Bad Request <br/>
    **Content:**
    
    ```json
    {
        "Error": "User already exists."
    }
    ```

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
    **Content:**
    
    ```json
    {
        "Error": "User does not exist."
    }
    ```

  OR

  * **Code:** 400 Bad Request <br/>
    **Content:**
    
    ```json
    {
        "Error": "Missing required field."
    }
    ```

**Update User**
----
  Updates user.

* **URL:** `/users`

* **Method:** `PUT`
  
*  **URL Params:** None

* **Data Params**

  **Required:** `email`

  **Optional:** `streetAddress`, `firstName`, `lastName`, `streetAddress`.

  **Sample Request:**
  
  ```json
  {
      "streetAddress": "20, Ocean Ave. Florida",
      "email": "alex@o.com"
  }
  ```

* **Success Response:**

  * **Code:** 200 <br/>
    **Content:**
    
    ```json
    {
        "Success": "User updated successfully."
    }
    ```
 
* **Error Response:**

  * **Code:** 404 Not Found <br/>
    **Content:**
    
    ```json
    {
        "Error": "User does not exist."
    }
    ```

  OR

  * **Code:** 400 Bad Request <br/>
    **Content:**
    
    ```json
    {
        "Error": "Missing required field."
    }
    ```
  
  OR

  * **Code:** 400 Bad Request <br/>
    **Content:**
    
    ```json
    {
        "Error": "Missing fields to update."
    }
    ```

**Delete User**
----
  Deletes user.

* **URL:** `/users?email=alex@o.com`

* **Method:** `DELETE`
  
*  **URL Params**

   **Required:** `email=[string]`

* **Data Params:** None

* **Success Response:**

  * **Code:** 200 <br/>
    **Content:**
    
    ```json
    {
        "Error": "User deleted successfully."
    }
    ```
 
* **Error Response:**

  * **Code:** 404 Not Found <br/>
    **Content:**
    
    ```json
    {
        "Error": "User does not exist."
    }
    ```

  OR

  * **Code:** 400 Bad Request <br/>
    **Content:**
    
    ```json
    {
        "Error": "Missing required field."
    }
    ```

----

**Log In**
----
  Logs user in.

* **URL:** `/login`

* **Method:** `POST`
  
*  **URL Params:** None

* **Data Params**

  **Required:** `email`, `password`.

* **Sample Request:**

  ```json
  {
      "email": "alex@o.com",
      "password": 123456
  }
  ```

* **Success Response:**

  * **Code:** 200 <br/>
    **Content:**
    
    ```json
    {
        "email": "alex@o.com",
        "tokenId": "2ph7dlfmwsn92r5djson",
        "expires": 1550784359160
    }
    ```
 
* **Error Response:**

  * **Code:** 400 Bad Request <br/>
    **Content:**
    
    ```json
    {
        "Error": "Missing required fields."
    }
    ```

  OR

  * **Code:** 404 Not Found <br/>
    **Content:**
    
    ```json
    {
        "Error": "User does not exist."
    }
    ```
  
  OR

  * **Code:** 400 Bad Request <br/>
    **Content:**
    
    ```json
    {
        "Error": "Password did not match the specified user's stored password."
    }
    ```

**Log Out**
----
  Logs user out.

* **URL:** `/logout`

* **Method:** `POST`

* **Authentication:** Requires token in header. E.g. `token: 2ph7dlfmwsn92r5djson`
  
*  **URL Params:** None

* **Data Params:** None

* **Sample Request:** None

* **Success Response:**

  * **Code:** 200 <br/>
    **Content:**
    
    ```json
    {
        "Success": "User logged out."
    }
    ```
 
* **Error Response:**

  * **Code:** 401 Not Authorized <br/>
    **Content:**
    
    ```json
    {
        "Error": "Authentication token not provided."
    }
    ```

----

**Menu**
----
  Displays a list of menu items.

* **URL:** `/menu`

* **Method:** `GET`
  
*  **URL Params:** None

* **Data Params:** None

* **Success Response:**

  * **Code:** 200 <br/>
    **Content:**
    
    ```json
    [
        {
            "id": 2,
            "name": "barbeque",
            "price": 13.99
        },
        {
            "id": 4,
            "name": "pepperoni",
            "price": 20.99
        },
        {
            "id": 5,
            "name": "marinara",
            "price": 17.99
        },
        {
            "id": 6,
            "name": "margherita",
            "price": 18.79
        }
    ]
    ```

  OR

  * **Code:** 200<br/>
    **Content:**
    
    ```json
    {
        "Message": "There are no items on the menu."
    }
    ```

* **Error Response:**

  * **Code:** 401 Not Authorized<br/>
    **Content:**
    
    ```json
    {
        "Error": "Authentication token not provided."
    }
    ```

  OR

  * **Code:** 401 Not Authorized<br/>
    **Content:**
    
    ```json
    {
        "Error": "Invalid token. Please log in again."
    }
    ```
