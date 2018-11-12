pragma solidity 0.4.25;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

import "./DateTime.sol";
import "./Federation.sol";
import "./Upgradable.sol";


/// @title Orbs billing and subscription smart contract.
contract SubscriptionManager is Upgradable {
    using SafeMath for uint256;

    // The version of the current subscription manager smart contract.
    string public constant VERSION = "0.2";

    // The Orbs token smart contract.
    ERC20 public orbs;

    // The federation smart contract.
    Federation public federation;

    // The minimal monthly subscription allocation.
    uint public minimalMonthlySubscription;

    struct Subscription {
        bytes32 id;
        string profile;
        uint256 startTime;
        uint256 tokens;
    }

    struct MonthlySubscriptions {
        mapping(bytes32 => Subscription) subscriptions;
        uint256 totalTokens;
    }

    /// A mapping between time (in a monthly resolution) and subscriptions, in the following format:
    ///     YEAR --> MONTH -->   MONTHLY_SUBSCRIPTION  --> SUBSCRIPTION_ID -->  SUBSCRIPTION
    ///     2017 -->  12   --> {<subscriptions>, 1000} -->     "User1"     --> {"User1", 100}
    mapping(uint16 => mapping(uint8 => MonthlySubscriptions)) public subscriptions;

    bytes32 constant public EMPTY = bytes32(0);

    event Subscribed(address indexed subscriber, bytes32 indexed id, uint256 value, uint256 startFrom);
    event DistributedFees(address indexed federationMember, uint256 value);

    /// @dev Constructor that initializes the address of the Orbs billing contract.
    /// @param _orbs ERC20 The address of the OrbsToken contract.
    /// @param _federation Federation The address of the Federation contract.
    /// @param _minimalMonthlySubscription uint256 The minimal monthly subscription allocation.
    constructor(ERC20 _orbs, Federation _federation, uint256 _minimalMonthlySubscription) public {
        require(address(_orbs) != address(0), "Address must not be 0!");
        require(address(_federation) != address(0), "Federation must not be 0!");
        require(_minimalMonthlySubscription != 0, "Minimal subscription value must be greater than 0!");

        orbs = _orbs;
        federation = _federation;
        minimalMonthlySubscription = _minimalMonthlySubscription;
    }

    /// @dev Returns the current month's subscription data.
    /// @param _id bytes32 The ID of the subscription.
    function getSubscriptionData(bytes32 _id) public view returns (bytes32 id, string profile, uint256 startTime,
        uint256 tokens) {
        require(_id != EMPTY, "ID must not be empty!");

        // Get the current year and month.
        uint16 currentYear;
        uint8 currentMonth;
        (currentYear, currentMonth) = getCurrentTime();

        return getSubscriptionDataByTime(_id, currentYear, currentMonth);
    }

    /// @dev Returns the monthly subscription status.
    /// @param _id bytes32 The ID of the subscription.
    /// @param _year uint16 The year of the subscription.
    /// @param _month uint8 The month of the subscription.
    function getSubscriptionDataByTime(bytes32 _id, uint16 _year, uint8 _month) public view returns (bytes32 id,
        string profile, uint256 startTime, uint256 tokens) {
        require(_id != EMPTY, "ID must not be empty!");

        MonthlySubscriptions storage monthlySubscription = subscriptions[_year][_month];
        Subscription memory subscription = monthlySubscription.subscriptions[_id];

        id = subscription.id;
        profile = subscription.profile;
        startTime = subscription.startTime;
        tokens = subscription.tokens;
    }

    /// @dev Distributes monthly fees to federation members.
    function distributeFees() public {
        // Get the current year and month.
        uint16 currentYear;
        uint8 currentMonth;
        (currentYear, currentMonth) = getCurrentTime();

        distributeFees(currentYear, currentMonth);
    }

    /// @dev Distributes monthly fees to federation members.
    function distributeFees(uint16 _year, uint8 _month) public {
        uint16 currentYear;
        uint8 currentMonth;
        (currentYear, currentMonth) = getCurrentTime();

        // Don't allow distribution of any future fees (specifically, next month's subscription fees).
        require(DateTime.toTimestamp(currentYear, currentMonth) >= DateTime.toTimestamp(_year, _month),
            "Can't distribute future fees!");

        address[] memory members = federation.getMembers();

        MonthlySubscriptions storage monthlySubscription = subscriptions[_year][_month];
        uint256 fee = monthlySubscription.totalTokens.div(members.length);
        require(fee > 0, "Fee must be greater than 0!");

        for (uint i = 0; i < members.length; ++i) {
            address member = members[i];
            uint256 memberFee = fee;

            // Distribute the remainder to the first node.
            if (i == 0) {
                memberFee = memberFee.add(monthlySubscription.totalTokens % members.length);
            }

            monthlySubscription.totalTokens = monthlySubscription.totalTokens.sub(memberFee);

            require(orbs.transfer(member, memberFee));
            emit DistributedFees(member, memberFee);
        }
    }

    /// @dev Receives subscription payment for the current month. This method needs to be called after the caller
    /// approves the smart contract to transfer _value ORBS tokens on its behalf.
    /// @param _id bytes32 The ID of the subscription.
    /// @param _profile string The name of the subscription profile. This parameter is ignored for subsequent
    /// subscriptions.
    /// @param _value uint256 The amount of tokens to fund the subscription.
    function subscribeForCurrentMonth(bytes32 _id, string _profile, uint256 _value) public {
        subscribe(_id, _profile, _value, now);
    }

    /// @dev Receives subscription payment for the next month. This method needs to be called after the caller approves
    /// the smart contract to transfer _value ORBS tokens on its behalf.
    /// @param _id bytes32 The ID of the subscription.
    /// @param _profile string The name of the subscription profile. This parameter is ignored for subsequent
    /// subscriptions.
    /// @param _value uint256 The amount of tokens to fund the subscription.
    function subscribeForNextMonth(bytes32 _id, string _profile, uint256 _value) public {
        // Get the current year and month.
        uint16 currentYear;
        uint8 currentMonth;
        (currentYear, currentMonth) = getCurrentTime();

        // Get the next month.
        uint16 nextYear;
        uint8 nextMonth;
        (nextYear, nextMonth) = DateTime.getNextMonth(currentYear, currentMonth);

        subscribe(_id, _profile, _value, DateTime.getBeginningOfMonth(nextYear, nextMonth));
    }

    /// @dev Receives subscription payment. This method needs to be called after the caller approves
    /// the smart contract to transfer _value ORBS tokens on its behalf.
    /// @param _id bytes32 The ID of the subscription.
    /// @param _profile string The name of the subscription profile. This parameter is ignored for subsequent
    /// subscriptions.
    /// @param _value uint256 The amount of tokens to fund the subscription.
    /// @param _startTime uint256 The start time of the subscription.
    function subscribe(bytes32 _id, string _profile, uint256 _value, uint256 _startTime) internal {
        require(_id != EMPTY, "ID must not be empty!");
        require(bytes(_profile).length > 0, "Profile must not be empty!");
        require(_value > 0, "Value must be greater than 0!");
        require(_startTime >= now, "Starting time must be in the future");

        // Verify that the subscriber approved enough tokens to pay for the subscription.
        require(orbs.transferFrom(msg.sender, address(this), _value), "Insufficient allowance!");

        uint16 year;
        uint8 month;
        (year, month) = getTime(_startTime);

        // Get the subscription.
        MonthlySubscriptions storage monthlySubscription = subscriptions[year][month];
        Subscription storage subscription = monthlySubscription.subscriptions[_id];

        // New subscription?
        if (subscription.id == EMPTY) {
            subscription.id = _id;
            subscription.profile = _profile;
            subscription.startTime = _startTime;
        }

        // Aggregate this month's subscription allocations.
        subscription.tokens = subscription.tokens.add(_value);

        // Make sure that the total monthly subscription allocation is above the minimal requirement.
        require(subscription.tokens >= minimalMonthlySubscription, "Subscription value is too low!");

        // Update selected month's total subscription allocations.
        monthlySubscription.totalTokens = monthlySubscription.totalTokens.add(_value);

        emit Subscribed(msg.sender, _id, _value, _startTime);
    }

    /// @dev A callback which will be called during an upgrade and will return the status of the of upgrade.
    function onUpgrade(Upgradable /*_newContract*/) internal returns (bool) {
        return true;
    }

    /// @dev Returns the current year and month.
    /// @return year uint16 The current year.
    /// @return month uint8 The current month.
    function getCurrentTime() private view returns (uint16 year, uint8 month) {
        return getTime(now);
    }

    /// @dev Returns the current year and month.
    /// @param _time uint256 The timestamp of the time to query.
    /// @return year uint16 The current year.
    /// @return month uint8 The current month.
    function getTime(uint256 _time) private pure returns (uint16 year, uint8 month) {
        year = DateTime.getYear(_time);
        month = DateTime.getMonth(_time);
    }
}
