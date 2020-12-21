pragma solidity ^0.4.24;

contract IImpactHours {

    bytes32 public constant ADD_IMPACT_HOURS_ROLE = keccak256("ADD_IMPACT_HOURS_ROLE");
    function initialize(address _hatch, uint256 _maxRate, uint256 _expectedRaisePerIH) external;
    function addImpactHours(address[] _contributors, uint256[] _hours, bool _last) external;
    function claimReward(address[] _contributors) external;
    function canPerform(address, address, bytes32, uint256[]) external view;
}
