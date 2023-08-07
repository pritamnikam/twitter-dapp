const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
// const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Twitter", function () {

    async function deployTwitterFixture() {
        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const Twitter = await ethers.getContractFactory("Twitter");
        const twitter = await Twitter.deploy();

        return { twitter, owner, otherAccount };
    }

    describe("Deployment", function () {
        it("Should be deployed with right owner", async function () {
            const { twitter, owner } = await loadFixture(deployTwitterFixture);
      
            expect(await twitter.owner()).to.equal(owner.address);
        });
    });

    describe("addTweet", function () {
        it("Should revert with the right error if called without enough value", async function () {
            const { twitter, otherAccount } = await loadFixture(deployTwitterFixture);
            await expect(twitter.connect(otherAccount).addTweet("Hi tweeter!", "no-image-url")).to.be.revertedWith(
                "Please submit 0.01 MATIC"
            );
        });

        it("Should not revert when 0.01 MATIC value passes", async function () {
            const { twitter, otherAccount } = await loadFixture(deployTwitterFixture);
            await expect(
                twitter.connect(otherAccount).addTweet(
                    "Hi tweeter!", 
                    "no-image-url", 
                    { value: ethers.parseEther('0.01') }
                )
            ).not.to.be.reverted;
        });

        it("Should increase the contract's balance", async function () {
            const { twitter, owner, otherAccount } = await loadFixture(deployTwitterFixture);
            const contractBalance = ethers.utils.balanceOf(owner);
            await twitter.connect(otherAccount).addTweet(
                "Hi tweeter!", 
                "no-image-url", 
                { value: ethers.parseEther('0.01') }
            );
            expect(await ethers.utils.balanceOf(owner)).to.be.not.equal(contractBalance);
        });

        it("Should decrese the sender's balance", async function () {
            const { twitter, otherAccount } = await loadFixture(deployTwitterFixture);
            const senderBalance = ethers.utils.balanceOf(otherAccount);
            await twitter.connect(otherAccount).addTweet(
                "Hi tweeter!", 
                "no-image-url", 
                { value: ethers.parseEther('0.01') }
            );
            expect(await ethers.utils.balanceOf(otherAccount)).to.be.not.equal(senderBalance);
        });
    });

    describe("deleteTweet", function () {
        it("Should revert with the right error if invalid tweet is passed", async function () {
            const { twitter } = await loadFixture(deployTwitterFixture);
            await expect(twitter.deleteTweet(1)).to.be.revertedWith(
                "Invalid tweet"
            );
        });

        it("Should revert with the right error if non owner calls deleted", async function () {
            const { twitter, otherAccount } = await loadFixture(deployTwitterFixture);
            await twitter.connect(otherAccount).addTweet(
                "Hi tweeter!", 
                "no-image-url", 
                { value: ethers.parseEther('0.01') }
            );
            await expect(twitter.deleteTweet()).to.be.revertedWith(
                "You aren't the owner"
            );
        });

        it("Should revert with the right error if tweet already deleted", async function () {
            const { twitter } = await loadFixture(deployTwitterFixture);
            await twitter.connect(otherAccount).addTweet(
                "Hi tweeter!", 
                "no-image-url", 
                { value: ethers.parseEther('0.01') }
            );
            await twitter.connect(otherAccount).deleteTweet(0);
            await expect(twitter.connect(otherAccount).deleteTweet(0)).to.be.revertedWith(
                "Tweet is already deleted"
            );
        });

        it("Should not revert when passes correct tweet id", async function () {
            const { twitter } = await loadFixture(deployTwitterFixture);
            await twitter.connect(otherAccount).addTweet(
                "Hi tweeter!", 
                "no-image-url", 
                { value: ethers.parseEther('0.01') }
            );
            await expect(twitter.deleteTweet(0)).not.to.be.reverted;
        });
    });

    describe("createAccount", function () {
        it("Should revert with appropriate error when username is empty", async function () {
            const { twitter } = await loadFixture(deployTwitterFixture);
            await expect(twitter.createAccount("", "description")).to.be.revertedWith(
                "username is empty"
            );
        });

        it("Should not revert when username is not empty", async function () {
            const { twitter } = await loadFixture(deployTwitterFixture);
            await expect(twitter.createAccount("user", "description")).not.to.be.reverted;
        });

        it("Should revert with appropriate error when username is already registered", async function () {
            const { twitter } = await loadFixture(deployTwitterFixture);
            await twitter.createAccount("user", "description");
            await expect(twitter.createAccount("user", "description")).to.be.revertedWith(
                "username is already registered"
            );
        });

    });

    describe("editAccount", function () {
        it("Should revert with appropriate error when user does not exist", async function () {
            const { twitter } = await loadFixture(deployTwitterFixture);
            await expect(twitter.editAccount("description", "pictureHash")).to.be.revertedWith(
                "ensure the user exists"
            );
        });

        it("Should not revert when user exist", async function () {
            const { twitter } = await loadFixture(deployTwitterFixture);
            await twitter.createAccount("user", "description");
            await expect(twitter.editAccount("new-description", "pictureHash")).not.to.be.reverted;
        });
    });

    describe("userExists", function () {
        it("Should return false when user does not exist", async function () {
            const { twitter, otherAccount } = await loadFixture(deployTwitterFixture);
            const actual = await twitter.userExists(otherAccount);
            expect(actual === false);
        });

        it("Should return true when user exist", async function () {
            const { twitter, otherAccount } = await loadFixture(deployTwitterFixture);
            await twitter.connect(otherAccount).createAccount("user", "description");
            const actual = await twitter.userExists(otherAccount);
            expect(actual === true);
        });
    });

    describe("Event", function () {
        it("Should emit TweetAdded", async function () {
            const { twitter, otherAccount } = await loadFixture(deployTwitterFixture);
            await expect(
                twitter.connect(otherAccount).addTweet(
                    "Hi tweeter!", 
                    "no-image-url", 
                    { value: ethers.parseEther('0.01') }
                )
            ).to.emit(twitter, 'TweetAdded');
        });

        it("Should emit TweetDeleted", async function () {
            const { twitter, otherAccount } = await loadFixture(deployTwitterFixture);
            await twitter.connect(otherAccount).addTweet(
                "Hi tweeter!", 
                "no-image-url", 
                { value: ethers.parseEther('0.01') }
            );

            await expect(
                twitter.connect(otherAccount).deleteTweet(0)
            ).to.emit(twitter, 'TweetDeleted');
        });
    });
});