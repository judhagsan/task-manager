<?php
if (!extension_loaded('pdo_mysql')) {
    http_response_code(500);
    die(json_encode(['error' => 'PDO MySQL extension is not loaded']));
}
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$method = $_SERVER['REQUEST_METHOD'];
$request = isset($_SERVER['PATH_INFO']) ? explode('/', trim($_SERVER['PATH_INFO'], '/')) : [];
$queryParams = $_GET;

try {
    $db = new PDO(
        "mysql:host=" . getenv('DB_HOST') . ";dbname=" . getenv('DB_NAME'),
        getenv('DB_USER'),
        getenv('DB_PASS')
    );
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

if (($request[0] ?? '') === 'tasks') {
    $id = $request[1] ?? null;

    switch ($method) {
        case 'GET':
            try {
                $baseQuery = "SELECT * FROM tasks";
                $conditions = [];
                $params = [];

                // Se houver ID na URL -> GET single task
                if ($id) {
                    $stmt = $db->prepare("SELECT * FROM tasks WHERE id = ?");
                    $stmt->execute([$id]);
                    $task = $stmt->fetch(PDO::FETCH_ASSOC);
        
                    if (!$task) {
                        http_response_code(404);
                        echo json_encode(['success' => false, 'error' => 'Task not found']);
                        break;
                    }
        
                    echo json_encode([
                        'success' => true,
                        'task' => $task 
                    ]);
                    break;
                }
                

                // Filtro por status
                if (isset($queryParams['filter']) && $queryParams['filter'] !== 'all') {
                    $conditions[] = "status = :status";
                    $params[':status'] = $queryParams['filter'];
                }
                
                // Filtro por pesquisa
                if (isset($queryParams['search']) && !empty($queryParams['search'])) {
                    $conditions[] = "(title LIKE :search OR description LIKE :search)";
                    $params[':search'] = '%' . $queryParams['search'] . '%';
                }
                
                // Monta a query completa
                if (!empty($conditions)) {
                    $baseQuery .= " WHERE " . implode(" AND ", $conditions);
                }
                $baseQuery = "SELECT * FROM tasks";
                
                $stmt = $db->prepare($baseQuery);
                $stmt->execute($params);
                $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Contagem por status para estatísticas
                $statsStmt = $db->query("
                    SELECT status, COUNT(*) as count 
                    FROM tasks 
                    GROUP BY status
                ");
                $stats = $statsStmt->fetchAll(PDO::FETCH_KEY_PAIR);
                
                echo json_encode([
                    'success' => true,
                    'tasks' => $tasks,
                    'stats' => $stats
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Database error: ' . $e->getMessage()
                ]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (empty($data['title'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Title is required']);
                break;
            }
            
            try {
                $stmt = $db->prepare("
                    INSERT INTO tasks (title, description, status) 
                    VALUES (:title, :description, :status)
                ");
                
                $stmt->execute([
                    ':title' => $data['title'],
                    ':description' => $data['description'] ?? '',
                    ':status' => $data['status'] ?? 'pendente'
                ]);
                
                $taskId = $db->lastInsertId();
                $stmt = $db->prepare("SELECT * FROM tasks WHERE id = ?");
                $stmt->execute([$taskId]);
                $newTask = $stmt->fetch(PDO::FETCH_ASSOC);
                
                http_response_code(201);
                echo json_encode(['success' => true, 'task' => $newTask]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            break;

        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Task ID is required']);
                break;
            }
            
            $data = json_decode(file_get_contents("php://input"), true);
            
            try {
                // Verifica se a tarefa existe
                $stmt = $db->prepare("SELECT id FROM tasks WHERE id = ?");
                $stmt->execute([$id]);
                
                $allowedStatus = ['pendente', 'em andamento', 'finalizado'];
                if (isset($data['status']) && !in_array(strtolower($data['status']), $allowedStatus)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false, 
                        'error' => 'Status inválido. Valores permitidos: ' . implode(', ', $allowedStatus)
                    ]);
                    break;
                }
                
                if (!$stmt->fetch()) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Task not found']);
                    break;
                }
                
                
                // Constrói a query dinamicamente
                $fields = [];
                $params = [':id' => $id];
                
                foreach (['title', 'description', 'status'] as $field) {
                    if (isset($data[$field])) {
                        $fields[] = "$field = :$field";
                        $params[":$field"] = $data[$field];
                    }
                }
                
                if (empty($fields)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'No fields to update']);
                    break;
                }
                
                $query = "UPDATE tasks SET " . implode(', ', $fields) . " WHERE id = :id";
                $stmt = $db->prepare($query);
                $stmt->execute($params);
                
                // Retorna a tarefa atualizada
                $stmt = $db->prepare("SELECT * FROM tasks WHERE id = ?");
                $stmt->execute([$id]);
                $updatedTask = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'task' => $updatedTask]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Task ID is required']);
                break;
            }
            
            try {
                // Verifica se a tarefa existe
                $stmt = $db->prepare("SELECT id FROM tasks WHERE id = ?");
                $stmt->execute([$id]);
                
                if (!$stmt->fetch()) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Task not found']);
                    break;
                }
                
                $stmt = $db->prepare("DELETE FROM tasks WHERE id = ?");
                $stmt->execute([$id]);
                
                http_response_code(200);
                echo json_encode(['success' => true, 'message' => 'Task deleted']);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            break;
    }
} else {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Not found']);
}