# The Node.js Master Class - Homework Assignment #2

This is the repo for the second assignment of The Node.js Master Class.

## API Documentation

This is the API documentation for a pizza-delivery company.

**Create User**
----
  Create a user and return json data.

* **URL:** `/users`

* **Method:** `POST`

* **Data Params**

  **Required:** `email`, `firstName`, `lastName`, `password`, `streetAddress`.

* **Sample Request:**

  ```json
  {
      "firstName": "Alex",
      "lastName": "Dale",
      "password": "123456",
      "streetAddress": "20, Ocean Ave. Florida",
      "email": "alex@o.com"
  }
  ```

* **Success Response:**

  * **Code:** 200<br/>
    **Content:**
    
    ```json
    {
        "Success": "User created successfully."
    }
    ```
 
* **Error Response:**

  * **Code:** 400 Bad Request<br/>
    **Content:**
    
    ```json
    {
        "Error": "Missing required fields."
    }
    ```

  OR

  * **Code:** 400 Bad Request<br/>
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

* **URL Params**

  **Required:** `email=[string]`

* **Success Response:**

  * **Code:** 200<br/>
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

  * **Code:** 404 Not Found<br/>
    **Content:**
    
    ```json
    {
        "Error": "User does not exist."
    }
    ```

  OR

  * **Code:** 400 Bad Request<br/>
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

  * **Code:** 200<br/>
    **Content:**
    
    ```json
    {
        "Success": "User updated successfully."
    }
    ```
 
* **Error Response:**

  * **Code:** 404 Not Found<br/>
    **Content:**
    
    ```json
    {
        "Error": "User does not exist."
    }
    ```

  OR

  * **Code:** 400 Bad Request<br/>
    **Content:**
    
    ```json
    {
        "Error": "Missing required field."
    }
    ```
  
  OR

  * **Code:** 400 Bad Request<br/>
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
  
* **URL Params**

  **Required:** `email=[string]`

* **Success Response:**

  * **Code:** 200<br/>
    **Content:**
    
    ```json
    {
        "Error": "User deleted successfully."
    }
    ```
 
* **Error Response:**

  * **Code:** 404 Not Found<br/>
    **Content:**
    
    ```json
    {
        "Error": "User does not exist."
    }
    ```

  OR

  * **Code:** 400 Bad Request<br/>
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

* **Data Params**

  **Required:** `email`, `password`.

* **Sample Request:**

  ```json
  {
      "email": "alex@o.com",
      "password": "123456"
  }
  ```

* **Success Response:**

  * **Code:** 200<br/>
    **Content:**
    
    ```json
    {
        "email": "alex@o.com",
        "tokenId": "2ph7dlfmwsn92r5djson",
        "expires": 1550784359160
    }
    ```
 
* **Error Response:**

  * **Code:** 400 Bad Request<br/>
    **Content:**
    
    ```json
    {
        "Error": "Missing required fields."
    }
    ```

  OR

  * **Code:** 404 Not Found<br/>
    **Content:**
    
    ```json
    {
        "Error": "User does not exist."
    }
    ```
  
  OR

  * **Code:** 400 Bad Request<br/>
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

* **Success Response:**

  * **Code:** 200<br/>
    **Content:**
    
    ```json
    {
        "Success": "User logged out."
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

----

**Show Menu**
----
  Returns json data about available menu items.

* **URL:** `/menu`

* **Method:** `GET`

* **Authentication:** Requires token in header. E.g. `token: 2ph7dlfmwsn92r5djson`

* **Success Response:**

  * **Code:** 200<br/>
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

----

**Update Cart**
----
  Add menu item to cart.

* **URL:** `/cart`

* **Method:** `PUT`

* **Authentication:** Requires token in header. E.g. `token: 2ph7dlfmwsn92r5djson`

* **Data Params:** `item`.

* **Sample Request:**

  ```json
  {
      "item": "barbeque"
  }
  ```

* **Success Response:**

  * **Code:** 200<br/>
    **Content:**
    
    ```json
    [
        {
            "name": "barbeque",
            "price": 17.99
        }
    ]
    ```

* **Error Response:**

  * **Code:** 400 Bad Request<br/>
    **Content:**
    
    ```json
    {
        "Error": "Item provided is not on menu."
    }
    ```

  OR

  * **Code:** 400 Bad Request<br/>
    **Content:**
    
    ```json
    {
        "Error": "Missing required field."
    }
    ```
  
  OR

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

----

**Show Cart**
----
  Returns json data about items in cart.

* **URL:** `/cart`

* **Method:** `GET`

* **Authentication:** Requires token in header. E.g. `token: 2ph7dlfmwsn92r5djson`

* **Success Response:**

  * **Code:** 200<br/>
    **Content:**
    
    ```json
    [
        {
            "name": "marinara",
            "price": 17.99
        }
    ]
    ```

* **Error Response:**

  * **Code:** 400 Bad Request<br/>
    **Content:**
    
    ```json
    {
        "Error": "Item provided is not on menu."
    }
    ```

  OR

  * **Code:** 400 Bad Request<br/>
    **Content:**
    
    ```json
    {
        "Error": "Missing required field."
    }
    ```
  OR

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

----

**Create Order**
----
  Create order and return json data.

* **URL:** `/order`

* **Method:** `POST`

* **Authentication:** Requires token in header. E.g. `token: 2ph7dlfmwsn92r5djson`

* **Success Response:**

  * **Code:** 200<br/>
    **Content:**
    
    ```json
    [
        {
            "id": "aa33pb27zt0ve33ehkcm",
            "value": {
                "name": "marinara",
                "price": 17.99
            }
        }
    ]
    ```

* **Error Response:**

  * **Code:** 400 Bad Request<br/>
    **Content:**
    
    ```json
    {
        "Error": "User has no shopping cart."
    }
    ```

  OR

  * **Code:** 400 Bad Request<br/>
    **Content:**
    
    ```json
    {
        "Error": "User's shopping cart is empty."
    }
    ```
  OR

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

**Show Order**
----
  Returns json data about available menu items.

* **URL:** `/menu?id=1ukwlzopiyou1lrmki2v`

* **Method:** `GET`

* **URL Params**

  **Required:** `id=[string]`

* **Authentication:** Requires token in header. E.g. `token: 2ph7dlfmwsn92r5djson`

* **Success Response:**

  * **Code:** 200<br/>
    **Content:**
    
    ```json
    {
        "id": "aa33pb27zt0ve33ehkcm",
        "user": "alex@gmail.com",
        "paid": false,
        "mailSent": false,
        "totalPrice": {
            "name": "marinara",
            "price": 17.99
        },
        "items": [
            {
                "name": "marinara",
                "price": 17.99
            }
        ]
    }
    ```

* **Error Response:**

  * **Code:** 400 Bad Request<br/>
    **Content:**
    
    ```json
    {
        "Error": "Authentication token not provided. Missing required field"
    }
    ```
  
  OR

  * **Code:** 400 Bad Request<br/>
    **Content:**
    
    ```json
    {
        "Error": "Order not found."
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

**Checkout**
----
  Send order details to Stripe, notify user via Mailgun, and return json response.

* **URL:** `/checkout`

* **Method:** `POST`

* **Authentication:** Requires token in header. E.g. `token: 2ph7dlfmwsn92r5djson`

* **Success Response:**

  * **Code:** 200<br/>
    **Content:**
    
    ```json
    {
        "Success": "Payment processed and user notified successfully."
    }
    ```

* **Error Response:**

  * **Code:** 500 Internal Server Error<br/>
    **Content:**
    
    ```json
    {
        "Error": "Unable to process payment."
    }
    ```

  OR
  
  * **Code:** 500 Internal Server Error<br/>
    **Content:**
    
    ```json
    {
        "Error": "Payment successful, but unable to notify user."
    }
    ```

  OR

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
        "Error": "Invalid token. Please login again."
    }
    ```
  OR

  * **Code:** 400 Bad Request<br/>
    **Content:**
    
    ```json
    {
        "Error": "Required fields missing."
    }
    ```
