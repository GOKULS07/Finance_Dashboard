import React, { useEffect, useState } from "react";
import { Card, Row, Col, Button, Modal, Form, Input, DatePicker, List } from "antd";
import { Column } from "@ant-design/charts";  
import moment from "moment";
import TransactionSearch from "./TransactionSearch";
import Header from "./Header";
import AddIncomeModal from "./Modals/AddIncome";
import AddExpenseModal from "./Modals/AddExpense";
import Loader from "./Loader";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";
import { addDoc, collection, getDocs, query } from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { SendOutlined, MessageOutlined } from "@ant-design/icons";


const Dashboard = () => {
  const [user] = useAuthState(auth);
  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);
  const [isIncomeModalVisible, setIsIncomeModalVisible] = useState(false);
  const [isSubscriptionModalVisible, setIsSubscriptionModalVisible] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [subscriptions, setSubscriptions] = useState([]);
  const [isChatBotVisible, setIsChatBotVisible] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const navigate = useNavigate();
  

  const processChartData = () => {
    const incomeData = [];
    const expenseData = [];
  
    transactions.forEach((transaction) => {
      const monthYear = moment(transaction.date).format("MMM YYYY");
  
      if (transaction.type === "income") {
        const existingData = incomeData.find(data => data.month === monthYear);
        if (existingData) {
          existingData.amount += transaction.amount;
        } else {
          incomeData.push({ month: monthYear, type: "Income", amount: transaction.amount });
        }
      } else {
        const existingData = expenseData.find(data => data.month === monthYear);
        if (existingData) {
          existingData.amount += transaction.amount;
        } else {
          expenseData.push({ month: monthYear, type: "Expenses", amount: transaction.amount });
        }
      }
    });
  
    return { chartData: [...incomeData, ...expenseData] };  
  };
  

  const { chartData } = processChartData();
;

  const showExpenseModal = () => setIsExpenseModalVisible(true);
  const showIncomeModal = () => setIsIncomeModalVisible(true);
  const showSubscriptionModal = () => setIsSubscriptionModalVisible(true);

  const handleExpenseCancel = () => setIsExpenseModalVisible(false);
  const handleIncomeCancel = () => setIsIncomeModalVisible(false);
  const handleSubscriptionCancel = () => setIsSubscriptionModalVisible(false);

  const onSubscriptionFinish = (values) => {
    const newSubscription = {
      name: values.name,
      validity: values.validity.format("YYYY-MM-DD"), 
      cost: parseFloat(values.cost),
    };
  
   
    setSubscriptions((prevSubscriptions) => [...prevSubscriptions, newSubscription]);
  
 
    const newTransaction = {
      type: "expense",
      date: moment().format("YYYY-MM-DD"), 
      amount: newSubscription.cost,
      tag: "Subscription",
      name: newSubscription.name,
    };
  
    
    setTransactions((prevTransactions) => [...prevTransactions, newTransaction]);
  
   
    addTransaction(newTransaction);
  
    
    setIsSubscriptionModalVisible(false);
    toast.success("Subscription Added!");
  };
  

  useEffect(() => {
    fetchTransactions();
  }, []);

  const onFinish = (values, type) => {
    const newTransaction = {
      type,
      date: moment(values.date).format("YYYY-MM-DD"),
      amount: parseFloat(values.amount),
      tag: values.tag,
      name: values.name,
    };

    setTransactions((prevTransactions) => [...prevTransactions, newTransaction]);
    setIsExpenseModalVisible(false);
    setIsIncomeModalVisible(false);
    addTransaction(newTransaction);
    calculateBalance();
  };

  const calculateBalance = () => {
    let incomeTotal = 0;
    let expensesTotal = 0;

    transactions.forEach((transaction) => {
      if (transaction.type === "income") {
        incomeTotal += transaction.amount;
      } else {
        expensesTotal += transaction.amount;
      }
    });

    setIncome(incomeTotal);
    setExpenses(expensesTotal);
    setCurrentBalance(incomeTotal - expensesTotal);
  };

  useEffect(() => {
    calculateBalance();
  }, [transactions]);

  async function addTransaction(transaction) {
    try {
      await addDoc(collection(db, `users/${user.uid}/transactions`), transaction);
      toast.success("Transaction Added!");
    } catch (e) {
      console.error("Error adding document: ", e);
      toast.error("Couldn't add transaction");
    }
  }

  async function fetchTransactions() {
    setLoading(true);
    if (user) {
      const q = query(collection(db, `users/${user.uid}/transactions`));
      const querySnapshot = await getDocs(q);
      let transactionsArray = [];
      querySnapshot.forEach((doc) => {
        transactionsArray.push(doc.data());
      });
      setTransactions(transactionsArray);
      toast.success("Transactions Fetched!");
    }
    setLoading(false);
  }

  const balanceConfig = {
    data: chartData,
    isGroup: true, 
    xField: "month",
    yField: "amount",
    seriesField: "type", 
    colorField: "type",  
    barWidthRatio: 0.4,  
    color: ({ type }) => (type === "Income" ? "#4BBA8E" : "#C9EBD4"),  
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
      },
    },
    yAxis: {
      label: {
        formatter: (val) => `₹${val}`,
      },
      minLimit: 0,  
    },
    grid: {
      line: {
        style: {
          stroke: "#EAEAEA",  
        },
      },
    },
  };
  
  

  const reset = () => {
    setIncome(0);
    setExpenses(0);
    setCurrentBalance(0);
    setTransactions([]);
    setSubscriptions([]);
    toast.success("Balance reset successfully!");
  };

  const cardStyle = {
    boxShadow: "0px 0px 30px 8px rgba(227, 227, 227, 0.75)",
    margin: "1rem 0",
    borderRadius: "0.5rem",
    padding: "20px",
    textAlign: "center",
    backgroundColor: "#fff",
  };

  const subscriptionButtonStyle = {
    backgroundColor: "#3f51b5", 
    borderColor: "#3f51b5",
    color: "#fff",
    borderRadius: "5px",
    padding: "0.5rem 1rem",
  };
  const toggleChatBot = () => {
    setIsChatBotVisible(!isChatBotVisible);
  };

  const handleChatInput = (e) => {
    setChatInput(e.target.value);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMessage = { sender: "user", message: chatInput.trim() };
    const botResponse = generateBotResponse(chatInput.trim());

    setChatHistory((prev) => [...prev, userMessage, botResponse]);
    setChatInput("");
  };

  const generateBotResponse = (input) => {
    let response = "I'm sorry, I didn't understand that.";
  
    if (input.toLowerCase().includes("balance")) {
      response = `Your current balance is ₹${currentBalance.toLocaleString()}. It’s great to have a surplus! Consider investing a portion to grow your wealth.`;
    } else if (input.toLowerCase().includes("income")) {
      response = `Your total income is ₹${income.toLocaleString()}. Keep tracking your sources of income, and explore opportunities to add more revenue streams!`;
    } else if (input.toLowerCase().includes("expenses")) {
      response = `Your total expenses are ₹${expenses.toLocaleString()}. It might be time to analyze your spending. Avoid unnecessary purchases and focus on essentials.`;
    } else if (input.toLowerCase().includes("subscriptions")) {
      if (subscriptions.length === 0) {
        response = "You have no active subscriptions. Start by adding any services you're currently paying for using the 'Add Subscription' button.";
      } else {
        response = `You have ${subscriptions.length} active subscriptions. Here's a quick summary:`;
        subscriptions.forEach((sub, idx) => {
          response += `\n${idx + 1}. ${sub.name} - ₹${sub.cost.toFixed(2)}, valid until ${moment(sub.validity).format(
            "MMM DD, YYYY"
          )}`;
        });
        response += `\n\nNeed help canceling unused subscriptions? Let me know!`;
      }
    } else if (input.toLowerCase().includes("recent transactions")) {
      if (transactions.length === 0) {
        response = "No recent transactions found. Start adding your income and expenses to see them here.";
      } else {
        response = "Here are your 5 most recent transactions:";
        transactions
          .slice(-5)
          .reverse()
          .forEach((transaction, idx) => {
            response += `\n${idx + 1}. ${transaction.name} - ₹${transaction.amount.toFixed(2)} on ${moment(
              transaction.date
            ).format("MMM DD, YYYY")}`;
          });
      }
    } else if (input.toLowerCase().includes("help")) {
      response = `I can assist you with the following:
      - "What is my current balance?"
      - "Show my income."
      - "List my expenses."
      - "Tell me about my subscriptions."
      - "Show recent transactions."
      - "How can I save more money?"
      - "What are my spending trends?"
      - "Suggest ways to grow my income."`;
    } else if (input.toLowerCase().includes("save money")) {
      response = `Saving money is important! Here are a few tips:
      1. Set a monthly budget and stick to it.
      2. Review your subscriptions and cancel any unused ones.
      3. Use cashback or reward programs.
      4. Prioritize needs over wants.
      5. Track your expenses regularly to identify patterns.`;
    } else if (input.toLowerCase().includes("spending trends")) {
      const topExpense = transactions
        .filter((t) => t.type === "expense")
        .sort((a, b) => b.amount - a.amount)[0];
  
      response = `Your spending trends show ${
        topExpense ? `your largest expense is "${topExpense.name}" costing ₹${topExpense.amount.toFixed(2)}.` : "no clear trends yet."
      } Regularly tracking your transactions can help identify where your money goes.`;
    } else if (input.toLowerCase().includes("income growth")) {
      response = `To grow your income, consider these ideas:
      1. Explore freelancing or part-time jobs.
      2. Invest in skill-building courses for better career opportunities.
      3. Look into passive income sources like dividends or rental properties.
      4. Negotiate for a raise if you're in a salaried job.`;
    }
  
    return { sender: "bot", message: response };
  };
  


  return (
    
    <div className="dashboard-container">
      
      <Header />

      {loading ? (
        <Loader />
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginTop: "0rem", display: "flex", alignItems: "stretch", padding: "2rem" }}>
  <Col span={8}>
    <Card style={{ ...cardStyle, height: "80%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "2rem" }}>
      <h2>Current Balance</h2>
      <p>₹{currentBalance.toLocaleString()}</p>
      <Button onClick={reset}>Reset Balance</Button>
    </Card>
  </Col>
  <Col span={8}>
    <Card style={{ ...cardStyle, height: "80%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "2rem" }}>
      <h2>Total Income</h2>
      <p>₹{income.toLocaleString()}</p>
      <Button onClick={showIncomeModal}>Add Income</Button>
    </Card>
  </Col>
  <Col span={8}>
    <Card style={{ ...cardStyle, height: "80%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "2rem" }}>
      <h2>Total Expenses</h2>
      <p>₹{expenses.toLocaleString()}</p>
      <Button onClick={showExpenseModal}>Add Expense</Button>
    </Card>
  </Col>
</Row>


         
          <Row gutter={[16, 16]} style={{ marginTop: "0rem", display: "flex", alignItems: "stretch", padding: "2rem" }}>
            <Col span={16}>
              <Card style={{ ...cardStyle, height: "100%" }}>
                <h2>Spending Analytics</h2>
                <Column {...balanceConfig} />
              </Card>
            </Col>
            <Col span={8}>
              <Card style={{ ...cardStyle, height: "100%", display: "flex", flexDirection: "column" }}>
                <h2>Subscriptions</h2>
                <Button type="primary" onClick={showSubscriptionModal} style={{ marginBottom: "1rem" }}>
                  Add Subscription
                </Button>
                {subscriptions.length > 0 ? (
                  <div style={{ overflowY: "auto", flexGrow: 1 }}>
                    <ul style={{ padding: 0, listStyle: "none" }}>
                      {subscriptions.map((sub, index) => (
                        <li key={index} style={{ marginBottom: "1rem" }}>
                          <Card size="small" style={{ textAlign: "left", padding: "1rem" }}>
                            <strong>{sub.name}</strong><br />
                            Validity: {moment(sub.validity).format('MMM DD, YYYY')}<br />
                            Cost: ₹{sub.cost.toFixed(2)}
                          </Card>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p>No subscriptions added yet.</p>
                )}
              </Card>
            </Col>
          </Row>
          
          <Row gutter={[16, 16]} style={{ marginTop: "0rem", display: "flex", alignItems: "stretch", padding: "2rem" }}>
  <Col span={24}>
    <Card style={{ ...cardStyle, height: "100%", padding: "2rem" }}>
      <h2>Transaction Search</h2>
      <TransactionSearch transactions={transactions} />
    </Card>
  </Col>
</Row>


          <AddExpenseModal
            isExpenseModalVisible={isExpenseModalVisible}
            handleExpenseCancel={handleExpenseCancel}
            onFinish={onFinish}
          />

          <AddIncomeModal
            isIncomeModalVisible={isIncomeModalVisible}
            handleIncomeCancel={handleIncomeCancel}
            onFinish={onFinish}
          />

          <Modal
            title="Add Subscription"
            visible={isSubscriptionModalVisible}
            onCancel={handleSubscriptionCancel}
            footer={null}
          >
            <Form layout="vertical" onFinish={onSubscriptionFinish}>
              <Form.Item
                label="Subscription Name"
                name="name"
                rules={[{ required: true, message: "Please input the subscription name!" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Validity Date"
                name="validity"
                rules={[{ required: true, message: "Please select the validity date!" }]}
              >
                <DatePicker />
              </Form.Item>
              <Form.Item
                label="Cost"
                name="cost"
                rules={[{ required: true, message: "Please input the subscription cost!" }]}
              >
                <Input type="number" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Add Subscription
                </Button>
              </Form.Item>
            </Form>
          </Modal>
          <Row>
            {/* Add a floating chatbot toggle button */}
            <Button
              style={{
                position: "fixed",
                bottom: "20px",
                right: "20px",
                zIndex: 1000,
                borderRadius: "50%",
                width: "60px",
                height: "60px",
                backgroundColor: "#3f51b5",
                color: "#fff",
              }}
              onClick={toggleChatBot}
              icon={<MessageOutlined />}
            />
          </Row>

          {/* Chatbot Modal */}
          <Modal
            title="Chatbot Assistant"
            visible={isChatBotVisible}
            onCancel={toggleChatBot}
            footer={null}
            bodyStyle={{
              maxHeight: "60vh",
              overflowY: "auto",
            }}
          >
            <List
              dataSource={chatHistory}
              renderItem={(item) => (
                <List.Item>
                  <Card
                    style={{
                      backgroundColor: item.sender === "bot" ? "#f1f1f1" : "#d9f7be",
                      marginLeft: item.sender === "bot" ? "auto" : "0",
                      maxWidth: "80%",
                    }}
                  >
                    {item.message}
                  </Card>
                </List.Item>
              )}
            />
            <div style={{ display: "flex", marginTop: "1rem" }}>
              <Input
                value={chatInput}
                onChange={handleChatInput}
                placeholder="Type your message..."
                onPressEnter={handleSendMessage}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                style={{ marginLeft: "8px" }}
              >
                Send
              </Button>
            </div>
          </Modal>
        </>
        
      )}
    </div>
    
  );
};

export default Dashboard;
