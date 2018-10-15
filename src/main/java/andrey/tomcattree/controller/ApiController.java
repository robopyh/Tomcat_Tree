package andrey.tomcattree.controller;

import andrey.tomcattree.model.Document;
import andrey.tomcattree.repository.DocumentRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/tree")
public class ApiController {

    private final DocumentRepository documentRepository;

    public ApiController(DocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    @RequestMapping("/roots")
    public Iterable<Document> getAllDocuments() {
        return documentRepository.findRoots();
    }

    @RequestMapping("/item/{id}/children")
    public List<Document> getChildren(@PathVariable("id") Long id) throws InterruptedException {
        // Requested load 2s delay
        Thread.sleep(2*1000);
        return documentRepository.findChildrenByParent(id);
    }

    @RequestMapping(method = RequestMethod.POST, value = "/changeParent")
    public void changeParent(@RequestBody Map<String, String> IDs) {
        Optional<Document> itemDB = documentRepository.findById(Long.valueOf(IDs.get("itemId")));
        if (itemDB.isPresent()) {
            Document item = itemDB.get();
            item.setParent(Long.valueOf(IDs.get("newParentId")));
            documentRepository.save(item);
        }
    }
}
