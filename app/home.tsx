import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ========================================
// BACKEND API URL
// ========================================

// Expo Web / PC Browser
const API_URL = "https://my-book-backend-6bf4.onrender.com/api/books";

// Physical Android Phone হলে:
// const API_URL = "http://YOUR_COMPUTER_IP:3000/api/books";

// ========================================
// BOOK TYPE
// ========================================

type tBook = {
  _id: string;
  name: string;
  totalPages: number;
  currentPage: number;
  percentage: number;
  createdAt?: string;
  updatedAt?: string;
};

// ========================================
// MAIN COMPONENT
// ========================================

export default function Book() {
  const [books, setBooks] = useState<tBook[]>([]);

  const [bookName, setBookName] = useState("");
  const [totalPages, setTotalPages] = useState("");

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ========================================
 // ========================================
// GET AUTH TOKEN
// ========================================
const getToken = async () => {
  const token = await AsyncStorage.getItem("token");

  console.log("MY TOKEN:", token);

  if (!token) {
    throw new Error("Login required");
  }

  return token;
};
  // ========================================
  // GET ALL BOOKS
  // ========================================

  const getBooks = useCallback(async () => {
    try {
      setLoading(true);

      const token = await getToken();

console.log("GET BOOKS:", API_URL);

      const response = await fetch(API_URL, {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      console.log("GET BOOKS RESPONSE:", result);

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load books",
        );
      }

      setBooks(result.data || []);
    } catch (error: any) {
      console.log("GET BOOKS ERROR:", error);

      Alert.alert(
        "Connection Error",
        error.message === "Login required"
          ? "Please login first."
          : "Books load করা যাচ্ছে না।\n\nBackend চালু আছে কিনা এবং API URL ঠিক আছে কিনা check করুন।",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ========================================
  // LOAD BOOKS WHEN SCREEN OPENS
  // ========================================

  useEffect(() => {
    getBooks();
  }, [getBooks]);

  // ========================================
  // ADD BOOK
  // ========================================

  const addBook = async () => {
    if (!bookName.trim()) {
      Alert.alert(
        "Missing Information",
        "Book name দিন।",
      );
      return;
    }

    if (!totalPages.trim()) {
      Alert.alert(
        "Missing Information",
        "Total pages দিন।",
      );
      return;
    }

    const pages = Number(totalPages);

    if (isNaN(pages) || pages <= 0) {
      Alert.alert(
        "Invalid Pages",
        "সঠিক total page number দিন।",
      );
      return;
    }

    try {
      setAdding(true);

      const token = await getToken();

      console.log("ADDING BOOK...");

      const response = await fetch(API_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          name: bookName.trim(),
          totalPages: pages,
        }),
      });

      const result = await response.json();

      console.log(
        "ADD BOOK RESPONSE:",
        result,
      );

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to add book",
        );
      }

      // Backend থেকে পাওয়া book
      const newBook: tBook = {
        ...result.data,
        percentage:
          result.data.percentage ?? 0,
      };

      // নতুন book list-এর শুরুতে add
      setBooks((prev) => [
        newBook,
        ...prev,
      ]);

      // Input clear
      setBookName("");
      setTotalPages("");

      Alert.alert(
        "Success",
        "Book successfully added!",
      );
    } catch (error: any) {
      console.log(
        "ADD BOOK ERROR:",
        error,
      );

      Alert.alert(
        "Error",
        error.message ||
          "Book add করা যায়নি।",
      );
    } finally {
      setAdding(false);
    }
  };

  // ========================================
  // UPDATE CURRENT PAGE
  // ========================================

  const updatePage = async (
    book: tBook,
    newPage: number,
  ) => {
    // 0-এর নিচে যেতে পারবে না
    if (newPage < 0) {
      return;
    }

    // Total pages-এর বেশি যেতে পারবে না
    if (newPage > book.totalPages) {
      return;
    }

    try {
      setUpdatingId(book._id);

      const token = await getToken();

      console.log(
        "UPDATE PAGE:",
        `${API_URL}/${book._id}/page`,
      );

      const response = await fetch(
        `${API_URL}/${book._id}/page`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            currentPage: newPage,
          }),
        },
      );

      const result = await response.json();

      console.log(
        "UPDATE PAGE RESPONSE:",
        result,
      );

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to update page",
        );
      }

      // Backend-এর updated data দিয়ে UI update
      setBooks((prev) =>
        prev.map((item) =>
          item._id === book._id
            ? result.data
            : item,
        ),
      );
    } catch (error: any) {
      console.log(
        "UPDATE PAGE ERROR:",
        error,
      );

      Alert.alert(
        "Error",
        error.message ||
          "Reading progress update করা যায়নি।",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ========================================
  // DELETE BOOK
  // ========================================

  const deleteBook = async (
    book: tBook,
  ) => {
    try {
      setUpdatingId(book._id);

      const token = await getToken();

      console.log(
        "DELETE BOOK:",
        `${API_URL}/${book._id}`,
      );

      const response = await fetch(
        `${API_URL}/${book._id}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      console.log(
        "DELETE BOOK RESPONSE:",
        result,
      );

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to delete book",
        );
      }

      // UI থেকে book remove
      setBooks((prev) =>
        prev.filter(
          (item) =>
            item._id !== book._id,
        ),
      );

      Alert.alert(
        "Success",
        "Book deleted successfully!",
      );
    } catch (error: any) {
      console.log(
        "DELETE BOOK ERROR:",
        error,
      );

      Alert.alert(
        "Error",
        error.message ||
          "Book delete করা যায়নি।",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ========================================
  // BOOK CARD
  // ========================================

  const renderBook = ({
    item,
  }: {
    item: tBook;
  }) => {
    const percentage =
      item.percentage ??
      Math.round(
        (item.currentPage /
          item.totalPages) *
          100,
      );

    const isUpdating =
      updatingId === item._id;

    return (
      <View style={styles.bookCard}>
        {/* ================================= */}
        {/* BOOK HEADER */}
        {/* ================================= */}

        <View style={styles.bookHeader}>
          <View style={styles.bookIcon}>
            <Ionicons
              name="book"
              size={25}
              color="#ffffff"
            />
          </View>

          <View style={styles.bookInfo}>
            <Text
              style={styles.bookName}
              numberOfLines={1}
            >
              {item.name}
            </Text>

            <Text
              style={styles.pageText}
            >
              {item.currentPage} /{" "}
              {item.totalPages} pages
            </Text>
          </View>

          {/* DELETE BUTTON */}

          <TouchableOpacity
            onPress={() =>
              deleteBook(item)
            }
            disabled={isUpdating}
          >
            <Ionicons
              name="trash-outline"
              size={22}
              color="#ff4d6d"
            />
          </TouchableOpacity>
        </View>

        {/* ================================= */}
        {/* PROGRESS TITLE */}
        {/* ================================= */}

        <View style={styles.progressTop}>
          <Text
            style={styles.progressTitle}
          >
            Reading Progress
          </Text>

          <Text
            style={styles.percentage}
          >
            {percentage}%
          </Text>
        </View>

        {/* ================================= */}
        {/* PROGRESS BAR */}
        {/* ================================= */}

        <View
          style={
            styles.progressBackground
          }
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${percentage}%`,
              },
            ]}
          />
        </View>

        {/* ================================= */}
        {/* PAGE CONTROLLER */}
        {/* ================================= */}

        <View style={styles.controller}>
          {/* MINUS */}

          <TouchableOpacity
            style={[
              styles.pageButton,
              item.currentPage === 0 &&
                styles.disabledButton,
            ]}
            disabled={
              item.currentPage === 0 ||
              isUpdating
            }
            onPress={() =>
              updatePage(
                item,
                item.currentPage - 1,
              )
            }
          >
            <Ionicons
              name="remove"
              size={22}
              color="#ffffff"
            />
          </TouchableOpacity>

          {/* CURRENT PAGE */}

          <View
            style={styles.currentPageBox}
          >
            {isUpdating ? (
              <ActivityIndicator
                size="small"
                color="#151638"
              />
            ) : (
              <Text
                style={
                  styles.currentPageText
                }
              >
                Page {item.currentPage}
              </Text>
            )}
          </View>

          {/* PLUS */}

          <TouchableOpacity
            style={[
              styles.pageButton,
              item.currentPage ===
                item.totalPages &&
                styles.disabledButton,
            ]}
            disabled={
              item.currentPage ===
                item.totalPages ||
              isUpdating
            }
            onPress={() =>
              updatePage(
                item,
                item.currentPage + 1,
              )
            }
          >
            <Ionicons
              name="add"
              size={22}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>

        {/* ================================= */}
        {/* COMPLETED */}
        {/* ================================= */}

        {percentage === 100 && (
          <View
            style={styles.completedBox}
          >
            <Ionicons
              name="checkmark-circle"
              size={20}
              color="#22c55e"
            />

            <Text
              style={
                styles.completedText
              }
            >
              Book Completed 🎉
            </Text>
          </View>
        )}
      </View>
    );
  };

  // ========================================
  // MAIN UI
  // ========================================

  return (
    <View style={styles.container}>
      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <View style={styles.header}>
        <View>
          <Text
            style={styles.headerTitle}
          >
            My Books
          </Text>

          <Text
            style={styles.headerSubtitle}
          >
            Track your reading progress
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="library-outline"
            size={27}
            color="#ffffff"
          />
        </View>
      </View>

      {/* ================================= */}
      {/* ADD BOOK */}
      {/* ================================= */}

      <View style={styles.addCard}>
        <Text style={styles.addTitle}>
          Add New Book
        </Text>

        {/* BOOK NAME */}

        <TextInput
          style={styles.input}
          placeholder="Book name"
          placeholderTextColor="#999"
          value={bookName}
          onChangeText={setBookName}
        />

        {/* TOTAL PAGES */}

        <TextInput
          style={styles.input}
          placeholder="Total pages"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={totalPages}
          onChangeText={
            setTotalPages
          }
        />

        {/* ADD BUTTON */}

        <TouchableOpacity
          style={[
            styles.addButton,
            adding &&
              styles.addButtonDisabled,
          ]}
          onPress={addBook}
          disabled={adding}
        >
          {adding ? (
            <ActivityIndicator
              size="small"
              color="#ffffff"
            />
          ) : (
            <>
              <Ionicons
                name="add"
                size={22}
                color="#ffffff"
              />

              <Text
                style={
                  styles.addButtonText
                }
              >
                Add Book
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ================================= */}
      {/* BOOK LIST */}
      {/* ================================= */}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator
            size="large"
            color="#ff4d6d"
          />

          <Text
            style={styles.loadingText}
          >
            Loading books...
          </Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) =>
            item._id
          }
          renderItem={renderBook}
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.list
          }
          refreshing={loading}
          onRefresh={getBooks}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="book-outline"
                size={55}
                color="#cfcfcf"
              />

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No books added yet
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Add your first book and
                start tracking.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f8fc",
    paddingHorizontal: 18,
    paddingTop: 55,
  },

  // HEADER

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#151638",
  },

  headerSubtitle: {
    fontSize: 14,
    color: "#777",
    marginTop: 4,
  },

  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#151638",
    justifyContent: "center",
    alignItems: "center",
  },

  // ADD BOOK

  addCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,

    elevation: 3,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,

    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  addTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#151638",
    marginBottom: 14,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 15,
    marginBottom: 12,
    color: "#222",
    backgroundColor: "#fafafa",
  },

  addButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#151638",

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    gap: 7,
  },

  addButtonDisabled: {
    opacity: 0.6,
  },

  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  // LIST

  list: {
    paddingBottom: 30,
  },

  // BOOK CARD

  bookCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 15,

    elevation: 2,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 7,

    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  bookHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  bookIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#ff4d6d",

    justifyContent: "center",
    alignItems: "center",

    marginRight: 12,
  },

  bookInfo: {
    flex: 1,
  },

  bookName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#151638",
  },

  pageText: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
  },

  // PROGRESS

  progressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    marginTop: 20,
    marginBottom: 8,
  },

  progressTitle: {
    fontSize: 13,
    color: "#777",
    fontWeight: "600",
  },

  percentage: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ff4d6d",
  },

  progressBackground: {
    height: 10,
    backgroundColor: "#eeeeee",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#ff4d6d",
    borderRadius: 10,
  },

  // PAGE CONTROLLER

  controller: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    marginTop: 18,
    gap: 10,
  },

  pageButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#151638",

    justifyContent: "center",
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.35,
  },

  currentPageBox: {
    minWidth: 110,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#f2f3f8",

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 15,
  },

  currentPageText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#151638",
  },

  // COMPLETED

  completedBox: {
    marginTop: 15,
    paddingVertical: 10,

    borderRadius: 10,
    backgroundColor: "#ecfdf3",

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    gap: 7,
  },

  completedText: {
    color: "#16a34a",
    fontWeight: "700",
  },

  // LOADING

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#777",
    fontSize: 14,
  },

  // EMPTY

  empty: {
    alignItems: "center",
    paddingTop: 50,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#555",
    marginTop: 12,
  },

  emptyText: {
    fontSize: 13,
    color: "#999",
    marginTop: 5,
    textAlign: "center",
  },
});