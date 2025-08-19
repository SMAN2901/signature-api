const production = {
  baseUrl: "https://selise.app",
  tokenApi: "api/identity/v100/identity/token",
  getUploadUrlApi: "api/storageservice/v100/StorageService/StorageQuery/GetPreSignedUrlForUpload",
  pollUploadStatusApi: "api/storageservice/v23/StorageService/StorageQuery/PollUploadStatus",
  prepareContractApi: "api/selisign/s1/SeliSign//ExternalApp/PrepareContract",
  prepareAndSendContractApi: "api/selisign/s1/SeliSign//ExternalApp/PrepareAndSendContract",
  sendContractApi: "api/selisign/s1/SeliSign//ExternalApp/RolloutContract",
  pollProcessApi: "api/signature/v1/Contract/PollProcess",
};

export default production;
