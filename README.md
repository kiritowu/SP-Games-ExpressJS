# SP GAMES Full-Stack Web Development
This repository contains the web application for my assignment in ST0503 Back-end Web Development built using MVC framework with **Express + MySQL** as back-end model & controller and **EJS** as front-end view.

## Getting Started
1. Clone the repository.
2. Install all dependencies by running `npm install`.
2. Run `sp_games_init.sql` MySQL SQL Script to initialise the database.
3. Modify the user credential in `model/db_config.js` for MySQL database connection.
4. Run `node ./index.js` to start the web app.
5. Access the website in **http://localhost:8081** through your browser.

# Project Documentation

## Sample Accounts
| Email         | Password        | Role      |
|:--            | :--             | :--       |
| sudo@xmail.com| sudopassword123 | Admin     |
|john@xmail.com | johnpassword123 | Customer  |

## Routing Endpoints Summary
<table>
    <thead>
        <th>Path</th>
        <th>Method</th>
        <th>Function</th>
        <th>Remarks</th>
    </thead>
    <tbody>
        <tr>
            <td colspan=4 style='text-align:center;'><b>Public Endpoints</b></td>
        </tr>
        <tr>
            <td>/</td>
            <td>GET</td>
            <td>
                <ul><li>Render Homepage</li></ul>
            </td>
            <td></td>
        </tr>
        <tr>
            <td>/login</td>
            <td>GET</td>
            <td>
                <ul><li>Render Login Page</li></ul>
            </td>
            <td></td>
        </tr>
        <tr>
            <td>/login</td>
            <td>POST</td>
            <td>
                <ul>
                    <li>Validate User Credential</li>
                    <li>Return Cookies with JWT expiring in 3 Hours if user’s credential is valid.</li>
                    <li>Redirect to ‘/login’ page and display error if user’s credential is invalid.</li>
                </ul>
            </td>
            <td>User id and type (*Role*) is encoded in payload of JWT.</td>
        </tr>
        <tr>
            <td>/logout</td>
            <td>GET</td>
            <td>
                <ul>
                    <li>Clear JWT Cookie and redirect to ‘/’</li>
                </ul>
            </td>
            <td></td>
        </tr>
        <tr>
            <td>/search</td>
            <td>GET</td>
            <td>
                <ul>
                    <li>Render Search Game Page according to queries given.</li>
                    <li>Form to search game base on game properties listed in ‘Queries’.</li>
                    <li>Allow Admin to Update or Delete Game.</li>
                    <li>Display Error if no game matches the queries.</li>
                </ul>
            </td>
            <td>
                <em>Queries</em>
                <ul>
                    <li>?id: Game ID</li>
                    <li>?title: Game Title</li>
                    <li>?max: Maximum Price</li>
                    <li>?min: Minimum Price</li>
                    <li>?year :Year Released</li>
                    <li>?cat: Category Name</li>
                    <li>?platform: Game Platform</li>
                    <li>?sortBy: Sort Price by ascending(asc) / descending(desc) or default(def)</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>/game/:gameID</td>
            <td>GET</td>
            <td>
                <ul>
                    <li>Render game details and reviews under same page.</li>
                    <li>Allow Users/Admin to create review and rating.</li>
                    <li>Hyperlink to search games with similar properties (E.g., same category) </li>
                    <li>Allow Admin to Update or Delete Game</li>
                    <li>Display Error if Game Id is not found or NaN.	</li>
                <ul>
            </td>
            <td></td>
        </tr>
        <tr>
            <td colspan=4 style='text-align:center;'><b>Admin Endpoints</b></td>
        </tr>
        <tr>
        <td>/admin</td>
        <td>GET	</td>
        <td>
            <ul>
                <li>Render admin homepage to Create or Update Game and Category</li>
            </ul>
        </td>
        <td rowspan = 6>Display Error if absence of JWT cookie or JWT  cookie provided is not an Admin token.</td>
        </tr>
        <tr>
            <td>/admin/game/new	</td>
            <td>GET	</td>
            <td>
                <ul>
                    <li>Render form to create new game.</li>
                    <li>Form Validation to validate user input and display relevant error message.</li>
                    <li>Redirect to ‘/search’ page if game is added successfully.	</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>/admin/game/:gameID/update</td>
            <td>GET	</td>
            <td>
                <ul>
                    <li>Render filled-value form of existing game.</li>
                    <li>Form Validation to validate user input and display relevant error message.</li>
                    <li>Redirect to ‘/search’ page if game is added successfully.</li>
                    <li>Display Error if gameID is not found or NaN.	</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>/admin/category/update	</td>
            <td>GET	</td>
            <td>
                <ul>
                    <li>Render admin page to list out all categories with buttons to update selected category.</li>
                    <li>Button to add new game	</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>/admin/category/new	</td>
            <td>GET	</td>
            <td>
                <ul>
                    <li>Render form to create category.</li>
                    <li>Form Validation to validate user input and display relevant error message.</li>
                    <li>Redirect to ‘/admin/category/update’ if category is added successfully.</li>
                    <li>Display Error if Category Name is existed.	</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>/admin/category/:catID/update</td>
            <td>GET	</td>
            <td>
                <ul>
                    <li>Render filled-value form of existing category.</li>
                    <li>Form validation to validate user input and display relevant error message.</li>
                    <li>Redirect to ‘/admin/category/update’ if category is updated successfully.</li>
                    <li>Display Error if Category Name is existed.</li>
                    <li>Display Error if catID is not found or NaN.	</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td colspan=4 style='text-align:center;'><b>APIs</b></td>
        </tr>
        <tr>
            <td>/api/…</td>
            <td>…	</td>
            <td>
                <ul>
                    <li>All API created for CA1 is grouped and routed under /api/…</li>
                    <li>Access Right to resources remain unchanged as in CA1.</li>
                    <li>Display Relevant Error Message if information provided is not complete.</li>
                </ul>
            </td>
            <td></td>
        </tr>
        <tr>
            <td>/api/search</td>
            <td>GET	</td>
            <td>
                <ul>
                    <li>Return array of games with relevant properties based on queries provided.</li>
                </ul>
            </td>
            <td>Refer /search for queries available</td>
        </tr>
    </tbody>
</table>

## License
Distributed under the MIT License. See `LICENSE` for more information.

## Contributors
- Wong Zhao Wu, Bryan 
- Li Yifan
