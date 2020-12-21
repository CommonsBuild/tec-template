pragma solidity 0.4.24;

import "@aragon/templates-shared/contracts/BaseTemplate.sol";
import "@aragon/os/contracts/lib/math/SafeMath64.sol";
import "@1hive/apps-dandelion-voting/contracts/DandelionVoting.sol";
import "@1hive/apps-redemptions/contracts/Redemptions.sol";
import "@1hive/apps-token-manager/contracts/HookedTokenManager.sol";
import {ITollgate as Tollgate} from "./external/ITollgate.sol";
import {IHatch as Hatch} from "./external/IHatch.sol";
import {IHatchOracle as HatchOracle} from "./external/IHatchOracle.sol";
import "./appIds/AppIdsXDai.sol";

contract HatchTemplate is BaseTemplate, AppIdsXDai {
    using SafeMath64 for uint64;

    string constant private ERROR_MISSING_MEMBERS = "MISSING_MEMBERS";
    string constant private ERROR_TOKENS_STAKES_MISMATCH = "TOKENS_STAKE_MISMATCH";
    string constant private ERROR_BAD_VOTE_SETTINGS = "BAD_SETTINGS";
    string constant private ERROR_NO_CACHE = "NO_CACHE";
    string constant private ERROR_NO_COLLATERAL = "NO_COLLATERAL";
    string constant private ERROR_NO_TOLLGATE_TOKEN = "NO_TOLLGATE_TOKEN";

    bool private constant TOKEN_TRANSFERABLE = true;
    uint8 private constant TOKEN_DECIMALS = uint8(18);
    uint256 private constant TOKEN_MAX_PER_ACCOUNT = uint256(-1);
    uint64 private constant DEFAULT_FINANCE_PERIOD = uint64(30 days);
    address private constant ANY_ENTITY = address(-1);
    uint8 private constant ORACLE_PARAM_ID = 203;
    enum Op { NONE, EQ, NEQ, GT, LT, GTE, LTE, RET, NOT, AND, OR, XOR, IF_ELSE }

    struct StoredAddresses {
        Kernel dao;
        ACL acl;
        DandelionVoting dandelionVoting;
        Vault fundingPoolVault;
        HookedTokenManager hookedTokenManager;
        address permissionManager;
        address collateralToken;
        Vault reserveVault;
        Hatch hatch;
    }

    mapping(address => StoredAddresses) internal senderStoredAddresses;

    constructor(DAOFactory _daoFactory, ENS _ens, MiniMeTokenFactory _miniMeFactory, IFIFSResolvingRegistrar _aragonID)
        BaseTemplate(_daoFactory, _ens, _miniMeFactory, _aragonID)
        public
    {
        _ensureAragonIdIsValid(_aragonID);
        _ensureMiniMeFactoryIsValid(_miniMeFactory);
    }

    // New DAO functions //

    /**
    * @dev Create the DAO and initialise the basic apps necessary for gardens
    * @param _voteTokenName The name for the token used by share holders in the organization
    * @param _voteTokenSymbol The symbol for the token used by share holders in the organization
    * @param _votingSettings Array of [supportRequired, minAcceptanceQuorum, voteDuration, voteBufferBlocks, voteExecutionDelayBlocks] to set up the voting app of the organization
    * @param _useAgentAsVault Whether to use an Agent app or Vault app
    */
    function createDaoTxOne(
        string _voteTokenName,
        string _voteTokenSymbol,
        uint64[5] _votingSettings,
        bool _useAgentAsVault,
        address _permissionManager
    )
        public
    {
        require(_votingSettings.length == 5, ERROR_BAD_VOTE_SETTINGS);

        (Kernel dao, ACL acl) = _createDAO();
        MiniMeToken voteToken = _createToken(_voteTokenName, _voteTokenSymbol, TOKEN_DECIMALS);
        Vault fundingPoolVault = _useAgentAsVault ? _installDefaultAgentApp(dao) : _installVaultApp(dao);

        DandelionVoting dandelionVoting = _installDandelionVotingApp(dao, voteToken, _votingSettings);
        HookedTokenManager hookedTokenManager = _installHookedTokenManagerApp(dao, voteToken, TOKEN_TRANSFERABLE, TOKEN_MAX_PER_ACCOUNT);

        if (_permissionManager == 0x0) {
            _permissionManager = address(dandelionVoting);
        }

        if (_useAgentAsVault) {
            _createAgentPermissions(acl, Agent(fundingPoolVault), dandelionVoting, _permissionManager);
        }
        _createEvmScriptsRegistryPermissions(acl, dandelionVoting, _permissionManager);
        _createCustomVotingPermissions(acl, dandelionVoting, hookedTokenManager);

        _storeAddressesTxOne(dao, acl, dandelionVoting, fundingPoolVault, hookedTokenManager, _permissionManager);
    }

    /**
    * @dev Add and initialise tollgate, redemptions and conviction voting or finance apps
    * @param _tollgateFeeToken The token used to pay the tollgate fee
    * @param _tollgateFeeAmount The tollgate fee amount
    * @param _redeemableTokens Array of initially redeemable tokens
    * @param _collateralToken Token distributed by conviction voting and used as collateral in fundraising
    */
    function createDaoTxTwo(
        ERC20 _tollgateFeeToken,
        uint256 _tollgateFeeAmount,
        address[] _redeemableTokens,
        address _collateralToken
    )
        public
    {
        require(_tollgateFeeToken != address(0), ERROR_NO_TOLLGATE_TOKEN);
        require(_collateralToken != address(0), ERROR_NO_COLLATERAL);
        require(senderStoredAddresses[msg.sender].dao != address(0), ERROR_NO_CACHE);

        (,
        ACL acl,
        DandelionVoting dandelionVoting,
        Vault fundingPoolVault,
        HookedTokenManager hookedTokenManager,
        address permissionManager) = _getStoredAddressesTxOne();

        Tollgate tollgate = _installTollgate(senderStoredAddresses[msg.sender].dao, _tollgateFeeToken, _tollgateFeeAmount, address(fundingPoolVault));
        _createTollgatePermissions(acl, tollgate, dandelionVoting);

        Redemptions redemptions = _installRedemptions(senderStoredAddresses[msg.sender].dao, fundingPoolVault, hookedTokenManager, _redeemableTokens);
        _createRedemptionsPermissions(acl, redemptions, dandelionVoting);

        _createPermissionForTemplate(acl, hookedTokenManager, hookedTokenManager.SET_HOOK_ROLE());
        hookedTokenManager.registerHook(dandelionVoting);
        _removePermissionFromTemplate(acl, hookedTokenManager, hookedTokenManager.SET_HOOK_ROLE());

        _storeAddressesTxTwo(_collateralToken);
    }

    /**
    * @dev Add and initialise fundraising apps
    * @param _minGoal Hatch min goal in wei
    * @param _maxGoal Hatch max goal in wei
    * @param _period Hatch length in seconds
    * @param _exchangeRate Hatch exchange rate in PPM
    * @param _vestingCliffPeriod Vesting cliff length for hatch bought tokens in seconds
    * @param _vestingCompletePeriod Vesting complete length for hatch bought tokens in seconds
    * @param _supplyOfferedPct Percent of total supply offered in hatch in PPM
    * @param _fundingForBeneficiaryPct Percent of raised hatch funds sent to the organization in PPM
    * @param _openDate The time the hatch starts, requires manual opening if set to 0
    */
    function createDaoTxThree(
        uint256 _minGoal,
        uint256 _maxGoal,
        uint64 _period,
        uint256 _exchangeRate,
        uint64 _vestingCliffPeriod,
        uint64 _vestingCompletePeriod,
        uint256 _supplyOfferedPct,
        uint256 _fundingForBeneficiaryPct,
        uint64 _openDate,
        address _scoreToken,
        uint256 _hatchOracleRatio
    )
        public
    {
        require(senderStoredAddresses[msg.sender].collateralToken != address(0), ERROR_NO_CACHE);

        Hatch hatch = _installHatch(
            _minGoal,
            _maxGoal,
            _period,
            _exchangeRate,
            _vestingCliffPeriod,
            _vestingCompletePeriod,
            _supplyOfferedPct,
            _fundingForBeneficiaryPct,
            _openDate
        );

        HatchOracle hatchOracle = _installHatchOracleApp(senderStoredAddresses[msg.sender].dao, _scoreToken, _hatchOracleRatio, address(hatch));

        _createHookedTokenManagerPermissions();
        _createHatchPermissions(hatchOracle);
    }

    /**
    * @dev Configure the fundraising collateral, install the hatch oracle and finalise permissions
    * @param _id Unique Aragon DAO ID
    */
    function createDaoTxFour(
        string _id
    )
        public
    {
        require(senderStoredAddresses[msg.sender].reserveVault != address(0), ERROR_NO_CACHE);

        _validateId(_id);
        (Kernel dao,, DandelionVoting dandelionVoting,,,) = _getStoredAddressesTxOne();

        _transferRootPermissionsFromTemplateAndFinalizeDAO(dao, dandelionVoting);
        _registerID(_id, dao);
        _deleteStoredContracts();
    }

    // App installation/setup functions //

    function _installHookedTokenManagerApp(
        Kernel _dao,
        MiniMeToken _token,
        bool _transferable,
        uint256 _maxAccountTokens
    )
        internal returns (HookedTokenManager)
    {
        HookedTokenManager hookedTokenManager = HookedTokenManager(_installDefaultApp(_dao, HOOKED_TOKEN_MANAGER_APP_ID));
        _token.changeController(hookedTokenManager);
        hookedTokenManager.initialize(_token, _transferable, _maxAccountTokens);
        return hookedTokenManager;
    }

    function _installHatchOracleApp(Kernel _dao, address _scoreToken, uint256 _oracleRatio, address _hatch)
        internal returns(HatchOracle)
    {
        HatchOracle hatchOracle = HatchOracle(_installNonDefaultApp(_dao, HATCH_ORACLE_ID));
        hatchOracle.initialize(_scoreToken, _oracleRatio, _hatch);
        return hatchOracle;
    }

    function _installDandelionVotingApp(Kernel _dao, MiniMeToken _voteToken, uint64[5] _votingSettings)
        internal returns (DandelionVoting)
    {
        DandelionVoting dandelionVoting = DandelionVoting(_installNonDefaultApp(_dao, DANDELION_VOTING_APP_ID));
        dandelionVoting.initialize(_voteToken, _votingSettings[0], _votingSettings[1], _votingSettings[2],
            _votingSettings[3], _votingSettings[4]);
        return dandelionVoting;
    }

    function _installTollgate(Kernel _dao, ERC20 _tollgateFeeToken, uint256 _tollgateFeeAmount, address _tollgateFeeDestination)
        internal returns (Tollgate)
    {
        Tollgate tollgate = Tollgate(_installNonDefaultApp(_dao, TOLLGATE_APP_ID));
        tollgate.initialize(_tollgateFeeToken, _tollgateFeeAmount, _tollgateFeeDestination);
        return tollgate;
    }

    function _installRedemptions(Kernel _dao, Vault _agentOrVault, HookedTokenManager _hookedTokenManager, address[] _redeemableTokens)
        internal returns (Redemptions)
    {
        Redemptions redemptions = Redemptions(_installNonDefaultApp(_dao, REDEMPTIONS_APP_ID));
        redemptions.initialize(_agentOrVault, TokenManager(_hookedTokenManager), _redeemableTokens);
        return redemptions;
    }

    function _installHatch(
        uint256 _minGoal,
        uint256 _maxGoal,
        uint64  _period,
        uint256 _exchangeRate,
        uint64  _vestingCliffPeriod,
        uint64  _vestingCompletePeriod,
        uint256 _supplyOfferedPct,
        uint256 _fundingForBeneficiaryPct,
        uint64  _openDate
    )
        internal returns (Hatch)
    {
        
        (Kernel dao,,,,,) = _getStoredAddressesTxOne();
        Vault reserveVault = _installVaultApp(dao);
        Hatch hatch = Hatch(_installNonDefaultApp(dao, HATCH_ID));

        _storeAddressesTxThree(reserveVault, hatch);
        address collateralToken = _getStoredAddressesTxTwo();

        _initializeHatch(
            _minGoal,
            _maxGoal,
            _period,
            _exchangeRate,
            _vestingCliffPeriod,
            _vestingCompletePeriod,
            _supplyOfferedPct,
            _fundingForBeneficiaryPct,
            _openDate,
            collateralToken
        );

        return hatch;
    }

    function _initializeHatch(
        uint256 _minGoal,
        uint256 _maxGoal,
        uint64  _period,
        uint256 _exchangeRate,
        uint64  _vestingCliffPeriod,
        uint64  _vestingCompletePeriod,
        uint256 _supplyOfferedPct,
        uint256 _fundingForBeneficiaryPct,
        uint64  _openDate,
        address _collateralToken
    )
        internal
    {
        // Accessing deployed contracts directly due to stack too deep error.
        senderStoredAddresses[msg.sender].hatch.initialize(
            TokenManager(senderStoredAddresses[msg.sender].hookedTokenManager),
            senderStoredAddresses[msg.sender].reserveVault,
            senderStoredAddresses[msg.sender].fundingPoolVault,
            _collateralToken,
            _minGoal,
            _maxGoal,
            _period,
            _exchangeRate,
            _vestingCliffPeriod,
            _vestingCompletePeriod,
            _supplyOfferedPct,
            _fundingForBeneficiaryPct,
            _openDate
        );
    }

    // Permission setting functions //

    function _createCustomVotingPermissions(ACL _acl, DandelionVoting _dandelionVoting, HookedTokenManager _hookedTokenManager)
        internal
    {
        (,,,,, address permissionManager) = _getStoredAddressesTxOne();
        _acl.createPermission(_dandelionVoting, _dandelionVoting, _dandelionVoting.MODIFY_QUORUM_ROLE(), permissionManager);
        _acl.createPermission(_dandelionVoting, _dandelionVoting, _dandelionVoting.MODIFY_SUPPORT_ROLE(), permissionManager);
        _acl.createPermission(_dandelionVoting, _dandelionVoting, _dandelionVoting.MODIFY_BUFFER_BLOCKS_ROLE(), permissionManager);
        _acl.createPermission(_dandelionVoting, _dandelionVoting, _dandelionVoting.MODIFY_EXECUTION_DELAY_ROLE(), permissionManager);
    }

    function _createTollgatePermissions(ACL _acl, Tollgate _tollgate, DandelionVoting _dandelionVoting) internal {
        (,,,,, address permissionManager) = _getStoredAddressesTxOne();
        _acl.createPermission(_dandelionVoting, _tollgate, _tollgate.CHANGE_AMOUNT_ROLE(), permissionManager);
        _acl.createPermission(_dandelionVoting, _tollgate, _tollgate.CHANGE_DESTINATION_ROLE(), permissionManager);
        _acl.createPermission(_tollgate, _dandelionVoting, _dandelionVoting.CREATE_VOTES_ROLE(), permissionManager);
    }

    function _createRedemptionsPermissions(ACL _acl, Redemptions _redemptions, DandelionVoting _dandelionVoting)
        internal
    {
        (,,,,, address permissionManager) = _getStoredAddressesTxOne();
        _acl.createPermission(ANY_ENTITY, _redemptions, _redemptions.REDEEM_ROLE(), address(this));
        _setOracle(_acl, ANY_ENTITY, _redemptions, _redemptions.REDEEM_ROLE(), _dandelionVoting);
        _acl.setPermissionManager(permissionManager, _redemptions, _redemptions.REDEEM_ROLE());

        _acl.createPermission(_dandelionVoting, _redemptions, _redemptions.ADD_TOKEN_ROLE(), permissionManager);
        _acl.createPermission(_dandelionVoting, _redemptions, _redemptions.REMOVE_TOKEN_ROLE(), permissionManager);
    }

    function _createHookedTokenManagerPermissions() internal {
        (, ACL acl, DandelionVoting dandelionVoting,, HookedTokenManager hookedTokenManager, address permissionManager) = _getStoredAddressesTxOne();
        (, Hatch hatch) = _getStoredAddressesTxThree();

        acl.createPermission(hatch, hookedTokenManager, hookedTokenManager.ISSUE_ROLE(), permissionManager);
        acl.createPermission(hatch, hookedTokenManager, hookedTokenManager.ASSIGN_ROLE(), permissionManager);
        acl.createPermission(hatch, hookedTokenManager, hookedTokenManager.REVOKE_VESTINGS_ROLE(), permissionManager);
        acl.createPermission(hatch, hookedTokenManager, hookedTokenManager.BURN_ROLE(), permissionManager);
    }

    function _createHatchPermissions(HatchOracle _hatchOracle) internal {
        (, ACL acl, DandelionVoting dandelionVoting,,, address permissionManager) = _getStoredAddressesTxOne();
        (Vault reserveVault, Hatch hatch) = _getStoredAddressesTxThree();

        acl.createPermission(ANY_ENTITY, hatch, hatch.OPEN_ROLE(), permissionManager);
        acl.createPermission(ANY_ENTITY, hatch, hatch.CONTRIBUTE_ROLE(), this);
        _setOracle(acl, ANY_ENTITY, hatch, hatch.CONTRIBUTE_ROLE(), _hatchOracle);
        acl.setPermissionManager(permissionManager, hatch, hatch.CONTRIBUTE_ROLE());
    }

    // Temporary Storage functions //

    function _storeAddressesTxOne(Kernel _dao, ACL _acl, DandelionVoting _dandelionVoting, Vault _agentOrVault, HookedTokenManager _hookedTokenManager, address _permissionManager)
        internal
    {
        StoredAddresses storage addresses = senderStoredAddresses[msg.sender];
        addresses.dao = _dao;
        addresses.acl = _acl;
        addresses.dandelionVoting = _dandelionVoting;
        addresses.fundingPoolVault = _agentOrVault;
        addresses.hookedTokenManager = _hookedTokenManager;
        addresses.permissionManager = _permissionManager;
    }

    function _getStoredAddressesTxOne() internal returns (Kernel, ACL, DandelionVoting, Vault, HookedTokenManager, address) {
        StoredAddresses storage addresses = senderStoredAddresses[msg.sender];
        return (
            addresses.dao,
            addresses.acl,
            addresses.dandelionVoting,
            addresses.fundingPoolVault,
            addresses.hookedTokenManager,
            addresses.permissionManager
        );
    }

    function _storeAddressesTxTwo(address _collateralToken) internal {
        StoredAddresses storage addresses = senderStoredAddresses[msg.sender];
        addresses.collateralToken = _collateralToken;
    }

    function _getStoredAddressesTxTwo() internal returns (address) {
        StoredAddresses storage addresses = senderStoredAddresses[msg.sender];
        return addresses.collateralToken;
    }

    function _storeAddressesTxThree(Vault _reserve, Hatch _hatch)
        internal
    {
        StoredAddresses storage addresses = senderStoredAddresses[msg.sender];
        addresses.reserveVault = _reserve;
        addresses.hatch = _hatch;
    }

    function _getStoredAddressesTxThree() internal returns (Vault, Hatch) {
        StoredAddresses storage addresses = senderStoredAddresses[msg.sender];
        return (
            addresses.reserveVault,
            addresses.hatch
        );
    }

    function _deleteStoredContracts() internal {
        delete senderStoredAddresses[msg.sender];
    }

    // Oracle permissions with params functions //

    function _setOracle(ACL _acl, address _who, address _where, bytes32 _what, address _oracle) private {
        uint256[] memory params = new uint256[](1);
        params[0] = _paramsTo256(ORACLE_PARAM_ID, uint8(Op.EQ), uint240(_oracle));

        _acl.grantPermissionP(_who, _where, _what, params);
    }

    function _paramsTo256(uint8 _id,uint8 _op, uint240 _value) private returns (uint256) {
        return (uint256(_id) << 248) + (uint256(_op) << 240) + _value;
    }
}
