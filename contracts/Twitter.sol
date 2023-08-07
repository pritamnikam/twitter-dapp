// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract Twitter {
    address public owner;
    uint256 private counter;

    constructor() {
        owner = msg.sender;
        counter = 0;
    }

    struct Tweet {
        address tweeter;    // owner of the tweet
        uint256 id;         // tweet id
        string tweetText;   // text message
        string tweetImage;  // IFPS hash of the image
        bool isDeleted;     // is tweet deleted by the users
        uint256 timestamp;  // timestamp when tweet is created/updated
    }

    struct User {
        uint256 creationDate;       // date user was created
        string username;            // username of the user
        string description;         // user profile description
        address owner;              // address of the account who created the user
        string profileImage;        // IFPS hash of the user's profile picture
        uint256[] tweets;           // array that holds the user's tweets
    }

    mapping(uint256 => Tweet) public tweets;
    mapping(address => User) public users;

    event TweetCreated(
        address tweeter,
        uint256 id,
        string tweetText,
        string tweetImage,
        bool isDeleted,
        uint256 timestamp
    );

    event TweetDeleted(
        uint256 tweetId,
        bool isDeleted
    );

    event UserAdded(
        string username, 
        string description
    );

    event UserUpdated(
        string username, 
        string description,
        string pictureHash
    );

    // Method to add new tweet
    function addTweet(
        string memory tweetText,
        string memory tweetImage
    ) public payable {
        require(
            msg.value == (0.01 ether),
            "Please submit 0.01 MATIC"
        );

        Tweet storage newTweet = tweets[counter];
        newTweet.id = counter;
        newTweet.tweeter = msg.sender;
        newTweet.tweetText = tweetText;
        newTweet.tweetImage = tweetImage;
        newTweet.isDeleted = false;
        newTweet.timestamp = block.timestamp;
        emit TweetCreated(
            msg.sender, 
            counter, 
            tweetText,
            tweetImage,
            false,
            block.timestamp
        );

        payable(owner).transfer(msg.value);

        User storage user = users[msg.sender];
        uint tweetIndex = user.tweets.length;
        user.tweets[tweetIndex] = counter;

        ++counter;
    }

    function deleteTweet(
        uint256 tweetId
    ) public {
        require(
            tweetId < counter,
            "Invalid tweet" 
        );

        Tweet storage tweet = tweets[tweetId];
        require(
            tweet.tweeter == msg.sender,
            "You aren't the owner"
        );

        require(
            !tweet.isDeleted,
            "Tweet is already deleted"
        );

        tweet.isDeleted = true;
        tweet.timestamp = block.timestamp;

        emit TweetDeleted(tweetId, true);
    }

    function createAccount(
        string memory username, 
        string memory description
    ) public {
        require(
            bytes(username).length > 0,
            "username is empty"
        );

        require(
            users[msg.sender].creationDate == 0,
            "username is already registered"
        );

        users[msg.sender].creationDate = block.timestamp;
        users[msg.sender].owner = msg.sender;
        users[msg.sender].username = username;
        users[msg.sender].description = description;

        emit UserAdded(
            username,
            description
        );
    }

    function editAccount(
        string memory description, 
        string memory pictureHash
    ) public {
        require(
            userExists(msg.sender),
            "ensure the user exists"
        );
        users[msg.sender].description = description;
        if (bytes(pictureHash).length > 0) {
            users[msg.sender].profileImage = pictureHash;
        }

        emit UserUpdated(
            users[msg.sender].username,
            description,
            pictureHash
        );
    }

    function userExists(
        address _address
    ) public view returns (bool) {
        return users[_address].creationDate != 0;
    }
}
