import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

// @ts-expect-error ts-ignore
import MTProto from "@mtproto/core/envs/browser";

type MTProtoContextType = {
  mtproto?: typeof MTProto;
  set_api_id: (id: number) => void;
  set_api_hash: (hash: string) => void;
};

export const MTProtoContext = createContext<MTProtoContextType>({
  mtproto: undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  set_api_id: (id) => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  set_api_hash: (hash) => {},
});

export const MTProtoClient: React.FC<PropsWithChildren> = ({ children }) => {
  const [mtprotoState, setMtprotoState] = useState(undefined);
  const [api_id, set_api_id] = useState<number | null>(null);
  const [api_hash, set_api_hash] = useState<string | null>(null);

  useEffect(() => {
    set_api_id(parseInt(localStorage.getItem("apiID") || ""));
    set_api_hash(localStorage.getItem("apiKey"));
  }, []);

  const _mtproto = useMemo(
    () =>
      api_id && api_hash
        ? new MTProto({
            api_id,
            api_hash,
          })
        : undefined,
    [api_id, api_hash],
  );
  useEffect(() => {
    if (mtprotoState && _mtproto === mtprotoState) return;
    if (mtprotoState) {
      // destroy session?
    }
    if (_mtproto) {
      setMtprotoState(_mtproto);
    }
  }, [_mtproto]);
  return (
    <MTProtoContext.Provider
      value={{
        mtproto: mtprotoState,
        set_api_id: (value: number) => set_api_id(value),
        set_api_hash: (value: string) => set_api_hash(value),
      }}
    >
      {children}
    </MTProtoContext.Provider>
  );
};

export const useMTProto = () => {
  const { mtproto, set_api_id, set_api_hash } = useContext(MTProtoContext);
  async function getUser() {
    try {
      const user = await mtproto.call("users.getFullUser", {
        id: {
          _: "inputUserSelf",
        },
      });

      return user;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  function sendCode(phone: string) {
    return mtproto.call("auth.sendCode", {
      phone_number: phone,
      settings: {
        _: "codeSettings",
      },
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function signIn({ code, phone, phone_code_hash }: any) {
    return mtproto.call("auth.signIn", {
      phone_code: code,
      phone_number: phone,
      phone_code_hash: phone_code_hash,
    });
  }
  function getPassword() {
    return mtproto.call("account.getPassword");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function checkPassword({ srp_id, A, M1 }: any) {
    return mtproto.call("auth.checkPassword", {
      password: {
        _: "inputCheckPasswordSRP",
        srp_id,
        A,
        M1,
      },
    });
  }
  function getDialogs() {
    return mtproto.call("messages.getDialogs", {
      offset_date: 0,
      offset_id: 0,
      offset_peer: {
        _: "inputPeerEmpty",
      },
      limit: 100,
      hash: 0,
    });
  }
  function getFolders() {
    return mtproto.call("messages.getDialogFilters");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getPeers(peers: any[]) {
    return mtproto.call("messages.getPeerDialogs", {
      peers,
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getHistory(peer: any) {
    return mtproto.call("messages.getHistory", {
      peer,
      offset_date: 0,
      offset_id: 0,
      offset_peer: {
        _: "inputPeerEmpty",
      },
      limit: 50,
      hash: 0,
    });
  }
  /**
   *
   * @param {'photo' | 'document'} type
   * @param {string} id
   * @param {string} accessHash
   * @param {Array<Number>} fileReference
   * @param {string?} photoSizeID
   * @returns {string}
   */
  async function downloadFile(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    id: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accessHash: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fileReference: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    photoSizeID: any,
  ) {
    const partSize = 524288 * 2;
    /**
     * @type {Number|undefined}
     */
    let dcId = 4;
    /**
     *
     * @param {Number} offset
     * @returns
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const downloadPart = async (offset: any) => {
      const body = {
        location:
          type === "photo"
            ? {
                _: "inputPhotoFileLocation",
                id,
                access_hash: accessHash,
                file_reference: fileReference,
                thumb_size: photoSizeID,
              }
            : {
                _: "inputDocumentFileLocation",
                id,
                access_hash: accessHash,
                file_reference: fileReference,
              },
        offset: offset,
        limit: partSize,
      };
      console.log(body, dcId);
      const file = await mtproto.call("upload.getFile", body, dcId && { dcId });
      return file;
    };

    let partBytesLength;
    let iter = 0;
    const fileChunks = [];
    while (partBytesLength === undefined || partBytesLength === partSize) {
      console.log("Downloading part of file", iter, iter * partSize);
      let file;
      try {
        file = await downloadPart(iter * partSize);
      } catch (e) {
        if (
          // @ts-expect-error ts-ignore
          e._ === "mt_rpc_error" &&
          // @ts-expect-error ts-ignore
          e.error_message.startsWith("FILE_MIGRATE_")
        ) {
          const _dcId = Number(
            // @ts-expect-error ts-ignore
            e.error_message.substring("FILE_MIGRATE_".length),
          );
          dcId = _dcId;
          continue;
        } else {
          throw e;
        }
      }
      partBytesLength = file.bytes.length;
      console.log(
        "Downloaded part of file",
        iter,
        iter * partSize,
        partBytesLength,
      );
      fileChunks.push(file.bytes);
      iter++;
    }
    const fileChunksBuffers = fileChunks.map((chunk) => Buffer.from(chunk));
    const fileBuffer = Buffer.concat(fileChunksBuffers);
    return fileBuffer;
  }

  return {
    mtproto,
    set_api_id,
    set_api_hash,
    getUser,
    sendCode,
    signIn,
    getPassword,
    checkPassword,
    getDialogs,
    getFolders,
    getPeers,
    getHistory,
    downloadFile,
  };
};
