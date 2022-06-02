//for hyperledger
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');

const { Gateway, Wallets } = require('fabric-network');
const { response } = require('../app');

//transaction format
// {
//   "Key":"49443065n",
//   "Record":{
//     "record_type":"service",
//     "service_center":"Mazda",
//     "service_date":"11/09/2019",
//     "vehicle_registration":"S860BDM",
//     "ecrypt_hash":"6abf4342dc9a9b570bfad88b4bd5da314c57fb599ca31c1d6a6eb0002b0a4de5",
//     "service_file_location":"https://wcservicerecordsdev.s3.amazonaws.com/49443065n.jpeg",
//     "service_options":{
//       "option1":"Oil Filter",
//       "option2":"Brake"
//     }
//   }
// }

function getTransactionJSONStr(identifier, record_type, service_center,service_date,vehicle_registration,ecrypt_hash,service_file_location,service_options) {
  return "{Key:\""+identifier+"\",Record:{record_type:\""+record_type+"\",service_center:\""+service_center+"\",service_date:\""+service_date+"\",vehicle_registration:\""+vehicle_registration+"\",ecrypt_hash:\""+ecrypt_hash+"\",service_file_location:\""+service_file_location+"\",service_options:\""+service_options+"\"}}";
}

exports.blockChainInvoke = async (req, res, next) => {
  const identifier = req.body.identifier;
  const record_type = req.body.record_type;
  const service_center = req.body.service_center;
  const service_date = req.body.service_date;
  const vehicle_registration = req.body.vehicle_registration;
  const ecrypt_hash = req.body.ecrypt_hash;
  const service_file_location = req.body.service_file_location;
  const service_options = req.body.service_options;

  const json_str = getTransaction(identifier,record_type,service_center,service_date,vehicle_registration,ecrypt_hash,service_file_location,service_options);

  try {
    // load the network configuration
    const ccpPath = path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      "fabric-samples",
      "test-network",
      "organizations",
      "peerOrganizations",
      "org1.example.com",
      "connection-org1.json"
    );
    let ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(process.cwd(), "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get("appUser");
    if (!identity) {
      console.log(
        'An identity for the user "appUser" does not exist in the wallet'
      );
      console.log("Run the registerUser.js application before retrying");
      return;
    }

    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: "appUser",
      discovery: { enabled: true, asLocalhost: true },
    });

    // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork("mychannel");

    // Get the contract from the network.
    const contract = network.getContract("fabcar");

    await contract.submitTransaction("createRecord", identifier, json_str);
    console.log("Transaction has been submitted");
    // Disconnect from the gateway.
    await gateway.disconnect();
    res.status(200).json({
      message: "Transaction has been submitted",
    })

  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    process.exit(1);
  }
};


exports.blockChainQuery = async (req, res, next) => {
  const identifier = req.body.identifier;
  try {
    // load the network configuration
    const ccpPath = path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      "fabric-samples",
      "test-network",
      "organizations",
      "peerOrganizations",
      "org1.example.com",
      "connection-org1.json"
    );
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(process.cwd(), "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get("appUser");
    if (!identity) {
      console.log(
        'An identity for the user "appUser" does not exist in the wallet'
      );
      console.log("Run the registerUser.js application before retrying");
      return;
    }

    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: "appUser",
      discovery: { enabled: true, asLocalhost: true },
    });

    // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork("mychannel");

    // Get the contract from the network.
    const contract = network.getContract("fabcar");

    const result = await contract.evaluateTransaction("queryRecord",identifier);
    console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
    await gateway.disconnect();
    //console.log('here');
    const result_str = result.toString()
    res.status(200).json({
      message: 'success',
      response: result_str
    })
  } catch (error) {
    console.error(`Failed to evaluate transaction: ${error}`);
    process.exit(1);
  }
};