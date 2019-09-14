const AWS = require('aws-sdk');

const s3 = new AWS.S3();
const BUCKET_NAME = '';
const IAM_USER_KEY = '';
const IAM_USER_SECRET = '';
// Bucket names must be unique across all S3 users


/**
 *upload new document to aws
 *
 * @export
 * @param {*} fileInByte
 * @param {*} FileKey
 * @param {*} fileName
 * @returns
 */
export async function uploadToS3(fileInByte, FileKey, fileName) {
	// set aws options
	let s3bucket = new AWS.S3({
		region: '',

		accessKeyId: IAM_USER_KEY,
		secretAccessKey: IAM_USER_SECRET,
		Bucket: BUCKET_NAME,
	});
	const params = {
		Bucket: BUCKET_NAME,
		Key: FileKey,
		Body: fileInByte,
	};

	const putObjectPromise = s3bucket.upload(params).promise();
	return putObjectPromise.then(function (data) {
		console.log('Success');
		console.log(data, 'data');
		return data;
	}).catch(function (err) {
		console.log(err);
		console.log(err, 'err');

	});
}
/**
 *update stored document in aws
 *
 * @export
 * @param {*} fileInByte
 * @param {*} FileKey
 * @returns
 */
export async function uploadUpdateToS3(fileInByte, FileKey) {
	//const FileKey = sha256(fileName + fileInByte + new Date());
	console.log(FileKey, 'hash');
	console.log(fileInByte, 'file');

	let s3bucket = new AWS.S3({
		accessKeyId: IAM_USER_KEY,
		secretAccessKey: IAM_USER_SECRET,
		Bucket: BUCKET_NAME,
	});
	const params = {
		Bucket: BUCKET_NAME,
		Key: FileKey,
		Body: fileInByte,
	};

	const putObjectPromise = s3bucket.upload(params).promise();
	return putObjectPromise.then(function (data) {
		console.log('Success');
		console.log(data, 'data');
		return data;
	}).catch(function (err) {
		console.log(err);
		console.log(err, 'err');

	});
}

/**
 *get the document from aws by key
 *
 * @export
 * @param {*} fileKey
 * @returns
 */
export async function getAwsFile(fileKey) {

	let s3bucket = new AWS.S3({
		accessKeyId: IAM_USER_KEY,
		secretAccessKey: IAM_USER_SECRET,
		Bucket: BUCKET_NAME,
	});
	const params = {
		Bucket: BUCKET_NAME,
		Key: fileKey,
	};

	const putObjectPromise = s3bucket.getObject(params).promise();
	return putObjectPromise.then(function (data) {
		console.log('Success');
		console.log(data, 'data');
		return data;
	}).catch(function (err) {
		console.log(err);
		console.log(err, 'err');

	});
}
