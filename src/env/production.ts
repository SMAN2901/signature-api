const production = {
  baseUrl: "https://selise.app",
  tokenApi: "api/identity/v100/identity/token",
  getUploadUrlApi: "api/storageservice/v23/StorageService/StorageQuery/GetPreSignedUrlForUpload",
  pollUploadStatusApi: "api/storageservice/v23/StorageService/StorageQuery/PollUploadStatus",
  prepareContractApi: "api/signature/v1/Contract/Prepare",
  prepareAndSendContractApi: "api/signature/v1/Contract/PrepareAndSend",
  sendContractApi: "api/signature/v1/Contract/Send",
  pollProcessApi: "api/signature/v1/Contract/PollProcess",
};

export default production;
