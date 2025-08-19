const development = {
  baseUrl: "https://msblocks.seliselocal.com",
  tokenApi: "api/identity/v20/identity/token",
  getUploadUrlApi: "api/storageservice/v23/StorageService/StorageQuery/GetPreSignedUrlForUpload",
  pollUploadStatusApi: "api/storageservice/v23/StorageService/StorageQuery/PollUploadStatus",
  prepareContractApi: "api/signature/v1/Contract/Prepare",
  prepareAndSendContractApi: "api/signature/v1/Contract/PrepareAndSend",
  sendContractApi: "api/signature/v1/Contract/Send",
  pollProcessApi: "api/signature/v1/Contract/PollProcess",
};

export default development;
