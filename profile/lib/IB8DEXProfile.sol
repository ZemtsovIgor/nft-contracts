// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

interface IB8DEXProfile {
    function createProfile(
        uint256 _teamId,
        address _nftAddress,
        uint256 _tokenId
    ) external;

    /**
     * @dev To pause user profile. It releases the NFT.
     * Callable only by registered users.
     */
    function pauseProfile() external;

    /**
     * @dev To update user profile.
     * Callable only by registered users.
     */
    function updateProfile(
        address _nftAddress,
        uint256 _tokenId
    ) external;

    /**
     * @dev To reactivate user profile.
     * Callable only by registered users.
     */
    function reactivateProfile(address _nftAddress, uint256 _tokenId) external;

    /**
     * @dev To increase the number of points for a user.
     * Callable only by point admins
     */
    function increaseUserPoints(
        address _userAddress,
        uint256 _numberPoints,
        uint256 _campaignId
    ) external;

    /**
     * @dev To increase the number of points for a set of users.
     * Callable only by point admins
     */
    function increaseUserPointsMultiple(
        address[] calldata _userAddresses,
        uint256 _numberPoints,
        uint256 _campaignId
    ) external;

    /**
     * @dev To increase the number of points for a team.
     * Callable only by point admins
     */

    function increaseTeamPoints(
        uint256 _teamId,
        uint256 _numberPoints,
        uint256 _campaignId
    ) external;

    /**
     * @dev To remove the number of points for a user.
     * Callable only by point admins
     */
    function removeUserPoints(address _userAddress, uint256 _numberPoints) external;

    /**
     * @dev To remove a set number of points for a set of users.
     */
    function removeUserPointsMultiple(address[] calldata _userAddresses, uint256 _numberPoints) external;

    /**
     * @dev To remove the number of points for a team.
     * Callable only by point admins
     */

    function removeTeamPoints(uint256 _teamId, uint256 _numberPoints) external;

    /**
     * @dev To add a NFT contract address for users to set their profile.
     * Callable only by owner admins.
     */
    function addNftAddress(address _nftAddress) external;

    /**
     * @dev Add a new teamId
     * Callable only by owner admins.
     */
    function addTeam(
        string calldata _teamName,
        string calldata _teamDescription
    ) external;

    /**
     * @dev Function to change team.
     * Callable only by special admins.
     */
    function changeTeam(address _userAddress, uint256 _newTeamId) external;

    /**
     * @dev Claim B8D to burn later.
     * Callable only by owner admins.
     */
    function claimFee(uint256 _amount) external;

    /**
     * @dev Make a team joinable again.
     * Callable only by owner admins.
     */
    function makeTeamJoinable(uint256 _teamId) external;

    /**
     * @dev Make a team not joinable.
     * Callable only by owner admins.
     */
    function makeTeamNotJoinable(uint256 _teamId) external;

    /**
     * @dev Rename a team
     * Callable only by owner admins.
     */
    function renameTeam(
        uint256 _teamId,
        string calldata _teamName,
        string calldata _teamDescription
    ) external;

    /**
     * @dev Update the number of B8D to register
     * Callable only by owner admins.
     */
    function updateNumberB8D(
        uint256 _newNumberB8DToReactivate,
        uint256 _newNumberB8DToRegister,
        uint256 _newNumberB8DToUpdate
    ) external;

    /**
     * @dev Check the user's profile for a given address
     */
    function getUserProfile(address _userAddress)
    external
    view
    returns (
        uint256,
        uint256,
        uint256,
        address,
        uint256,
        bool
    );

    /**
     * @dev Check the user's status for a given address
     */
    function getUserStatus(address _userAddress) external view returns (bool);

    /**
     * @dev Check a team's profile
     */
    function getTeamProfile(uint256 _teamId)
    external
    view
    returns (
        string memory,
        string memory,
        uint256,
        uint256,
        bool
    );
}
