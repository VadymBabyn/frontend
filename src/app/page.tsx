"use client";
import { useState, useEffect } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid"; // Іконки для кнопки

interface Message {
  id: string;
  sender: string;
  content: string;
  isError?: boolean;
}

interface Chat {
  id: string;
  name: string;
}

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatListOpen, setChatListOpen] = useState(true); // Управління видимістю списку чатів
  const [selectedChat, setSelectedChat] = useState<string | null>(null); // Вибір активного чату
  const [chats, setChats] = useState<Chat[]>([]); // Список чатів
  const [newChatName, setNewChatName] = useState<string>("");

  const fetchMessages = async (chatId: string) => {
    try {
      const response = await fetch(`http://localhost:8080/messages/${chatId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };
  
const [isLoading, setIsLoading] = useState(false);

const sendMessage = async (chatId: string, text: string) => {
    setIsLoading(true); // Початок завантаження
    try {
      const response = await fetch("http://localhost:8080/messages/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: text,
          chatId: chatId,
          sender: "User", 
          recipient: "ChatGPT",
        }),
      });

      if (!response.ok) {
        throw new Error("Помилка відправки повідомлення");
      }

      const newMessage = await response.json();

      setMessages((prevMessages) => [...prevMessages, newMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Не вдалося відправити повідомлення. Спробуйте пізніше.");
    } finally {
      setIsLoading(false); // Завершення завантаження
      fetchMessages(chatId);
    }
  };



  const fetchChats = async () => {
    try {
      const response = await fetch("http://localhost:8080/chats");
      if (!response.ok) {
        throw new Error("Помилка завантаження чатів");
      }
      const data: Chat[] = await response.json();
      setChats(data);
    } catch (error) {
      console.error("Error fetching chats:", error);
      alert("Не вдалося завантажити чати. Спробуйте пізніше.");
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const addChat = async () => {
    if (newChatName.trim()) {
      try {
        const response = await fetch("http://localhost:8080/chats", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: newChatName }),
        });

        if (!response.ok) {
          throw new Error("Помилка створення чату");
        }

        setNewChatName(""); // Очищаємо поле після успішного додавання
        await fetchChats(); // Оновлюємо список чатів
      } catch (error) {
        console.error("Помилка при створенні чату:", error);
        alert("Не вдалося створити чат. Спробуйте пізніше.");
      }
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`http://localhost:8080/chats/${chatId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Помилка видалення чату");
      }

      setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
      if (selectedChat === chatId) {
        setSelectedChat(null); // Знімаємо вибір з видаленого чату
      }
    } catch (error) {
      console.error("Помилка при видаленні чату:", error);
      alert("Не вдалося видалити чат. Спробуйте пізніше.");
    }
  };

  return (
    <div className="flex h-screen">
      <button
        onClick={() => setChatListOpen(!isChatListOpen)}
        className="fixed top-4 left-4 z-50 p-3 bg-blue-600 text-white rounded-lg"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {isChatListOpen && (
        <div className="w-1/4 h-full bg-white shadow-lg p-4 border-r z-40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ marginTop: "8px", marginLeft: "60px" }}>
              Список чатів
            </h2>
            <button
              onClick={() => setChatListOpen(false)} 
              className="text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4" style={{ marginTop: "35px" }}>
            <input
              type="text"
              placeholder="Введите имя нового чата"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              className="p-2 border border-gray-300 rounded-md w-full"
            />
            <button
              onClick={addChat}
              className="mt-2 p-2 bg-blue-500 text-white rounded-md w-full"
            >
              Добавить чат
            </button>
          </div>

          <ul>
            {chats.map((chat) => (
              <li
                key={chat.id}
                className="cursor-pointer p-2 hover:bg-gray-200 flex justify-between items-center"
                onClick={() => {
                  setSelectedChat(chat.id);
                  fetchMessages(chat.id); // Завантажуємо повідомлення чату при виборі
                }}
              >
                {chat.name}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                  className="ml-2 text-red-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

        <div className="flex-1 flex flex-col h-full">
          <div className="flex-1 p-4 overflow-auto">
            {selectedChat ? (
              <>
                <div className="mb-4 ml-14 mt-2">
                  <h2 className="text-2xl font-bold">Чат {selectedChat}</h2>
                </div>
                <div className="border-b mb-4">
                  {messages.reduce((acc: JSX.Element[], message, index) => {
                    if (message.sender === "User") {
                      // Якщо відправник User, додаємо новий блок "питання + відповідь"
                      acc.push(
                        <div key={message.id} className="mb-4">
                          <div className="p-2 mb-2 bg-gray-100 font-bold">{message.content}</div>
                          {messages[index + 1]?.sender === "ChatGPT" && (
                            <div className="p-2 mb-2 bg-blue-100 ml-14">{messages[index + 1].content}</div>
                          )}
                        </div>
                      );
                    }
                    return acc;
                  }, [])}
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500">Виберіть чат для спілкування</p>
            )}
          </div>

          <div className="p-4 bg-white border-t flex items-center">
            <input
              type="text"
              placeholder="Введіть повідомлення"
              className="flex-1 p-2 border border-gray-300 rounded-md"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value) {
                  sendMessage(selectedChat!, e.currentTarget.value); // Передаємо chatId та текст
                  e.currentTarget.value = "";
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                if (input && input.value && selectedChat) {
                  sendMessage(selectedChat, input.value);
                  input.value = "";
                }
              }}
              className="ml-2 p-2 bg-blue-500 text-white rounded-md"
            >
              Відправити
            </button>
          </div>
        </div>
    </div>
  );
}
