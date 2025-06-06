/** eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useMTProto } from "@/mtproto";
import { Card } from "@/components/ui/card";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { mtproto, getUser, getDialogs, getFolders, getPeers, getHistory } =
    useMTProto();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [dialogsLoading, setDialogsLoading] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [folder, setFolder] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dialogs, setDialogs] = useState<any[]>([]);
  useEffect(() => {
    if (!mtproto) {
      return;
    }
    if (user) {
      return;
    }
    getUser().then((result) => {
      if (!result) {
        localStorage.removeItem("is_login");
        navigate("/login");
        return;
      }
      setUser(result.users[0]);
    });
  }, [mtproto, user]);
  const GROUP_NAME = "Eru";

  useEffect(() => {
    if (!user) {
      return;
    }
    setDialogsLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getFolders().then((result: any[]) => {
      const _folder = result.find((_folder) => _folder.title === GROUP_NAME);
      setFolder(_folder);
    });
  }, [user]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [includePeers, setIncludePeers] = useState<any[]>([]);
  useEffect(() => {
    if (!folder) {
      return;
    }
    setIncludePeers(folder.include_peers);
  }, [folder]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messagesRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesCounter, setMessagesCounter] = useState<number>(0);
  const loadedDialogsCountRef = useRef<number>(0);
  const existsDialogsCountRef = useRef<number>(0);

  useEffect(() => {
    if (includePeers.length === 0) {
      return;
    }
    setMessagesCounter(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _dialogs: any[] = [];
    includePeers.forEach((inclPeer) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getPeers([inclPeer]).then((result: any) => {
        existsDialogsCountRef.current += result.chats.length ? 1 : 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result.chats.slice(0, 1).forEach((_peer: any) => {
          _dialogs.push({ title: _peer.title, id: _peer.id });
          setDialogs(_dialogs);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getHistory(inclPeer).then((history: any) => {
            loadedDialogsCountRef.current += 1;
            setMessagesCounter(loadedDialogsCountRef.current);
            messagesRef.current = [...messagesRef.current, ...history.messages];
            if (
              loadedDialogsCountRef.current === existsDialogsCountRef.current
            ) {
              setDialogsLoading(false);
              setMessages(messagesRef.current);
            }
          });
        });
      });
    });
  }, [includePeers]);

  const handleLogout = () => {
    localStorage.removeItem("is_login");
    navigate("/login");
  };

  return (
    <div className="container">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b pb-3">
        <h1 className="text-xl font-semibold">Home</h1>
        <Button onClick={handleLogout}>Logout</Button>
      </div>

      {/* Main Content Area */}
      <div className="mt-4">
        {!user && <p>Loading user info...</p>}
        {user && (
          <>
            <h2 className="text-lg font-medium mb-4">
              Welcome {user.first_name}!
            </h2>
          </>
        )}
        {dialogsLoading && (
          <p>
            Loading dialogs... {messagesCounter}/{includePeers.length}
          </p>
        )}
        {messages.length > 0 && (
          <div className="overflow-auto max-w-screen">
            <div className="flex flex-col gap-4">
              {messages
                .sort((a, b) => {
                  return b.date - a.date;
                })
                .map((message, index) =>
                  message.message ? (
                    <div key={`${message.id}${index}`}>
                      <Card className="text-left p-4 flex flex-col gap-2">
                        <div className="flex flex-row justify-between">
                          <div className="font-bold text-base">
                            {message.peer_id._ === "peerChannel"
                              ? dialogs.find(
                                  (d) => d.id == message.peer_id.channel_id,
                                )?.title
                              : null}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(message.date * 1000).toLocaleString()}
                          </div>
                        </div>
                        <div className="whitespace-pre-wrap text-sm">
                          {message.message
                            ? message.message
                            : message.media
                              ? JSON.stringify(message.media)
                              : ""}
                        </div>
                      </Card>
                    </div>
                  ) : null,
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
